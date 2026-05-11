import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

logger = logging.getLogger(__name__)


class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token_str = self._get_token()

        if not token_str:
            logger.warning("WS: no token provided")
            return  # not calling accept() rejects the handshake

        try:
            access_token = AccessToken(token_str)
            user_id = access_token['user_id']
            self.user = await self._get_user(user_id)
        except TokenError as e:
            logger.warning(f"WS: invalid token — {e}")
            return
        except Exception as e:
            logger.error(f"WS: auth error — {e}")
            return

        self.user_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        if self.user.role in ('super_admin', 'admin'):
            await self.channel_layer.group_add('orders_staff', self.channel_name)
            logger.info(f"WS: {self.user.email} ({self.user.role}) connected → staff group")
        else:
            logger.info(f"WS: {self.user.email} (user) connected → personal group")

        await self.accept()

        # Send a ping so the client knows connection is live
        await self.send(text_data=json.dumps({'event': 'connected', 'role': self.user.role}))

    async def disconnect(self, close_code):
        if not hasattr(self, 'user'):
            return
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if self.user.role in ('super_admin', 'admin'):
            await self.channel_layer.group_discard('orders_staff', self.channel_name)
        logger.info(f"WS: {self.user.email} disconnected (code={close_code})")

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def order_notification(self, event):
        await self.send(text_data=json.dumps(event['data']))

    def _get_token(self) -> str:
        query = self.scope.get('query_string', b'').decode()
        params = dict(p.split('=', 1) for p in query.split('&') if '=' in p)
        return params.get('token', '')

    @database_sync_to_async
    def _get_user(self, user_id):
        from apps.users.models import User
        return User.objects.get(id=user_id, is_active=True)
