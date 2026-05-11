from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/status/', views.OrderStatusUpdateView.as_view(), name='order-status-update'),
    path('<int:pk>/cancel/', views.cancel_order, name='order-cancel'),
    path('settings/', views.PlantSettingsView.as_view(), name='plant-settings'),
    path('public-settings/', views.get_public_settings, name='public-settings'),
]
