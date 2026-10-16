import json
import logging
import math

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from google import genai
from google.genai import types
from google.genai.errors import APIError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Diagnosis
from .serializers import DiagnosisSerializer

logger = logging.getLogger(__name__)


def _is_finite_number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def _high_risk_metrics(patient_data):
    metrics = []
    if patient_data['trestbps'] >= 130:
        metrics.append({
            'name': 'Resting blood pressure',
            'value': patient_data['trestbps'],
            'unit': 'mm Hg',
        })
    if patient_data['chol'] >= 240:
        metrics.append({
            'name': 'Total cholesterol',
            'value': patient_data['chol'],
            'unit': 'mg/dL',
        })
    if patient_data['fbs'] == 1:
        metrics.append({
            'name': 'Fasting blood sugar',
            'value': 'above 120',
            'unit': 'mg/dL',
        })
    return metrics


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_smart_health_routine(request):
    if request.data.get('risk_prediction') != 'yes':
        return Response(
            {"error": "A routine is only available for a high-risk result."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    patient_data = request.data.get('patient_data')
    if not isinstance(patient_data, dict):
        return Response(
            {"error": "Patient metrics are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    required_metrics = ('trestbps', 'chol', 'fbs')
    if any(
        key not in patient_data or not _is_finite_number(patient_data[key])
        for key in required_metrics
    ):
        return Response(
            {"error": "Blood pressure, cholesterol, and fasting blood sugar must be numeric."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (
        not 0 < patient_data['trestbps'] <= 300
        or not 0 < patient_data['chol'] <= 1000
        or patient_data['fbs'] not in (0, 1)
    ):
        return Response(
            {"error": "One or more patient metrics are outside the accepted range."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.GEMINI_API_KEY:
        logger.error("Smart health routine requested without GEMINI_API_KEY configured.")
        return Response(
            {"error": "The smart health routine service is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    metrics = _high_risk_metrics(patient_data)
    metric_context = json.dumps(metrics)
    prompt = (
        "Create a concise, empathetic lifestyle or dietary routine for an adult "
        "whose heart-risk screening result is high. These are the only measured "
        "values flagged by this app's screening rules: "
        f"{metric_context}. Provide exactly three short, practical steps in the "
        "JSON response schema. Focus on supportive, generally heart-healthy "
        "habits and tailor suggestions to the flagged values when present. "
        "If the list is empty, do not claim that any specific measurement is "
        "abnormal; offer general heart-healthy habits instead. Do not diagnose, "
        "prescribe supplements or medication, or suggest changing prescribed "
        "treatment. Encourage discussing results with a healthcare professional. "
        "This is educational support, not medical advice."
    )

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=400,
                response_mime_type='application/json',
                response_schema={
                    'type': 'OBJECT',
                    'properties': {
                        'steps': {
                            'type': 'ARRAY',
                            'items': {'type': 'STRING'},
                        },
                    },
                    'required': ['steps'],
                },
            ),
        )
    except APIError:
        logger.exception("Gemini failed to generate a smart health routine.")
        return Response(
            {"error": "The smart health routine could not be generated right now."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    try:
        result = json.loads(response.text or '')
    except (json.JSONDecodeError, TypeError):
        logger.warning("Gemini returned a non-JSON smart health routine.")
        return Response(
            {"error": "The smart health routine response was invalid."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    steps = result.get('steps') if isinstance(result, dict) else None
    if (
        not isinstance(steps, list)
        or len(steps) != 3
        or any(not isinstance(step, str) or not step.strip() for step in steps)
    ):
        logger.warning("Gemini returned a smart health routine without exactly three steps.")
        return Response(
            {"error": "The smart health routine response was invalid."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({"steps": [step.strip() for step in steps]})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    phone_number = request.data.get('phone_number', '').strip()
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')

    required_fields = {
        'name': name,
        'email': email,
        'phone_number': phone_number,
        'password': password,
        'confirm_password': confirm_password,
    }
    missing_fields = [field for field, value in required_fields.items() if not value]
    if missing_fields:
        return Response(
            {"error": "All fields are required", "missing_fields": missing_fields},
            status=status.HTTP_400_BAD_REQUEST
        )

    if '@' not in email or '.' not in email.rsplit('@', 1)[-1]:
        return Response({"error": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)

    if password != confirm_password:
        return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        name_parts = name.split(None, 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        return Response({
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}".strip(),
                "phone_number": phone_number,
            }
        }, status=status.HTTP_201_CREATED)

    except Exception:
        return Response(
            {"error": "Registration failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {"error": "Email and password required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=email, password=password)

    if user is not None:
        response_data = {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}".strip() or user.email,
                "username": user.username
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    else:
        return Response(
            {"error": "Invalid email or password"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    
@api_view(['POST'])
def create_diagnosis(request):
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response(
            {"error": "User ID required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        diagnosis = Diagnosis.objects.create(
            user=user,
            age=request.data.get('age'),
            sex=request.data.get('sex'),
            cp=request.data.get('cp'),
            trestbps=request.data.get('trestbps'),
            chol=request.data.get('chol'),
            fbs=request.data.get('fbs'),
            restecg=request.data.get('restecg'),
            thalach=request.data.get('thalach'),
            exang=request.data.get('exang'),
            oldpeak=request.data.get('oldpeak'),
            slope=request.data.get('slope'),
            ca=request.data.get('ca'),
            thal=request.data.get('thal'),
            risk_prediction=request.data.get('risk_prediction'),
            probability=request.data.get('probability'),
            explanation=request.data.get('explanation', '')
        )
        
        serializer = DiagnosisSerializer(diagnosis)
        return Response({
            "message": "Diagnosis saved successfully",
            "diagnosis": serializer.data
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {"error": f"Failed to create diagnosis: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_user_diagnoses(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        diagnoses = Diagnosis.objects.filter(user=user)
        serializer = DiagnosisSerializer(diagnoses, many=True)
        return Response(serializer.data)
    
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch diagnoses: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_users(request):
    users = User.objects.all().values('id', 'username', 'email', 'first_name', 'last_name')
    return Response(list(users))


