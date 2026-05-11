import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.orders.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    # No AllowedHostsOriginValidator in dev — allows ws://localhost:3000 → ws://localhost:8000
    'websocket': URLRouter(websocket_urlpatterns),
})
