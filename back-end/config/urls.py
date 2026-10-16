"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from django.http import JsonResponse
from users import views as user_views


def custom_404(request, exception):
    return JsonResponse(
        {"error": "Not found", "detail": "The requested endpoint was not found."},
        status=404,
    )


handler404 = custom_404

urlpatterns = [
    path('register/', user_views.register_user, name='register'),
    path('api/register/', user_views.register_user),
    path('api/login/', user_views.login_user),
    path('api/users/', user_views.get_users),
    path('api/diagnosis/', user_views.create_diagnosis),
    path('api/diagnosis/<int:user_id>/', user_views.get_user_diagnoses),
]
