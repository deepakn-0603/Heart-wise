from rest_framework import serializers
from .models import Diagnosis

class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = [
            'id', 'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 
            'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 
            'ca', 'thal', 'risk_prediction', 'probability', 
            'explanation', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']