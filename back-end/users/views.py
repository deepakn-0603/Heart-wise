import re
import random
import string
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Diagnosis
from .serializers import DiagnosisSerializer
from django.core.mail import send_mail
from rest_framework import status
from django.core.cache import cache

EMAIL_REGEX = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """Send OTP to email"""
    email = request.data.get('email')
    
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not re.match(EMAIL_REGEX, email):
        return Response({"error": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)
    
    otp = ''.join(random.choices(string.digits, k=6))
    
    cache.set(f'otp_{email}', otp, timeout=600)
    
    try:
        send_mail(
            subject='HeartWise Email Verification',
            message=f'Your verification code is: {otp}\n\nThis code expires in 10 minutes.',
            from_email='noreply@heartwise.com',  # Update this
            recipient_list=[email],
            fail_silently=False,
        )
        
        return Response({
            "message": "OTP sent successfully",
            "email": email
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return Response(
            {"error": "Failed to send OTP. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP"""
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response(
            {"error": "Email and OTP are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cached_otp = cache.get(f'otp_{email}')
    
    if not cached_otp:
        return Response(
            {"error": "OTP expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if cached_otp != otp:
        return Response(
            {"error": "Invalid OTP. Please try again."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    cache.set(f'verified_{email}', True, timeout=1800)  
    cache.delete(f'otp_{email}')  
    
    return Response({
        "message": "Email verified successfully",
        "verified": True
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name', '')
    
    if not cache.get(f'verified_{email}'):
        return Response(
            {"error": "Please verify your email first"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not email or not password:
        return Response(
            {"error": "Email and password required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=email).exists():
        return Response(
            {"error": "User already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        name_parts = name.split(' ', 1) if name else ['', '']
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        cache.delete(f'verified_{email}')
        
        
        return Response({
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}".strip(),
            }
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {"error": f"Registration failed: {str(e)}"},
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



