import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


@receiver(post_save, sender='orders.Order')
def broadcast_order_event(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning("Signal: channel_layer is None — channels not configured?")
        return

    try:
        if created:
            payload = {
                'event': 'new_order',
                'order_id': instance.order_id,
                'customer': instance.customer_name,
                'phone': instance.phone,
                'order_type': instance.order_type,
                'quantity': instance.quantity,
                'total': str(instance.total_price),
            }
            async_to_sync(channel_layer.group_send)(
                'orders_staff',
                {'type': 'order_notification', 'data': payload},
            )
            logger.info(f"Signal: broadcasted new_order {instance.order_id} to orders_staff")
        else:
            payload = {
                'event': 'order_updated',
                'order_id': instance.order_id,
                'customer': instance.customer_name,
                'status': instance.status,
                'payment_status': instance.payment_status,
            }
            async_to_sync(channel_layer.group_send)(
                'orders_staff',
                {'type': 'order_notification', 'data': payload},
            )
            if instance.user_id:
                async_to_sync(channel_layer.group_send)(
                    f'user_{instance.user_id}',
                    {'type': 'order_notification', 'data': payload},
                )
            logger.info(f"Signal: broadcasted order_updated {instance.order_id}")
    except Exception as e:
        logger.error(f"Signal: failed to broadcast — {e}")
