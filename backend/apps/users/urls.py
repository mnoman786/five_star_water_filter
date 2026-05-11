from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserListCreateView.as_view(), name='user-list-create'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('admins/', views.AdminListView.as_view(), name='admin-list'),
    path('activity-logs/', views.ActivityLogListView.as_view(), name='activity-logs'),
]
