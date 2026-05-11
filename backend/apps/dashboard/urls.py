from django.urls import path
from . import views

urlpatterns = [
    path('super-admin/', views.super_admin_dashboard, name='super-admin-dashboard'),
    path('admin/', views.admin_dashboard, name='admin-dashboard'),
    path('export/', views.export_report, name='export-report'),
]
