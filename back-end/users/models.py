from django.db import models
from django.contrib.auth.models import User

class Diagnosis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diagnoses')
    age = models.IntegerField()
    sex = models.IntegerField()
    cp = models.IntegerField()
    trestbps = models.IntegerField()
    chol = models.IntegerField()
    fbs = models.IntegerField()
    restecg = models.IntegerField()
    thalach = models.IntegerField()
    exang = models.IntegerField()
    oldpeak = models.FloatField()
    slope = models.IntegerField()
    ca = models.IntegerField()
    thal = models.IntegerField()
    
    risk_prediction = models.CharField(max_length=10)
    probability = models.FloatField()
    explanation = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Diagnosis for {self.user.email} - {self.created_at}"