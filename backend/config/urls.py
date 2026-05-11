from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = "Fiver Star Water Filter Plant"
admin.site.site_title = "Water Filter Admin"
admin.site.index_title = "Welcome to Fiver Star Water Filter Plant"
