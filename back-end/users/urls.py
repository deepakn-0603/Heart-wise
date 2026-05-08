from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user),
    path('send-otp/', views.send_otp),
    path('verify-otp/', views.verify_otp),
    path('login/', views.login_user),
    path('users/', views.get_users),
    path('diagnosis/', views.create_diagnosis),
    path('diagnosis/<int:user_id>/', views.get_user_diagnoses),
]