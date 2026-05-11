from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Order, PlantSettings
from .serializers import (
    OrderSerializer, OrderCreateSerializer,
    OrderStatusUpdateSerializer, PlantSettingsSerializer
)
from .filters import OrderFilter
from apps.users.permissions import IsSuperAdmin, IsAdminOrSuperAdmin


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['order_id', 'customer_name', 'phone']
    ordering_fields = ['created_at', 'total_price', 'status']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('super_admin', 'admin'):
            return Order.objects.select_related('user', 'assigned_to').all()
        return Order.objects.filter(user=user).select_related('user')


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('super_admin', 'admin'):
            return Order.objects.select_related('user').all()
        return Order.objects.filter(user=user)

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        if request.user.role == 'user' and order.status != 'pending':
            return Response(
                {'error': 'You can only cancel pending orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.delete()
        return Response({'message': 'Order deleted'}, status=status.HTTP_204_NO_CONTENT)


class OrderStatusUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = OrderStatusUpdateSerializer
    queryset = Order.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Log activity
        from apps.users.models import ActivityLog
        ActivityLog.objects.create(
            user=request.user,
            action='status_change',
            description=f"Order #{instance.order_id} status changed to {request.data.get('status', instance.status)}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response(OrderSerializer(instance, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, pk):
    try:
        if request.user.role == 'user':
            order = Order.objects.get(pk=pk, user=request.user)
        else:
            order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != 'pending':
        return Response({'error': 'Only pending orders can be cancelled'}, status=status.HTTP_400_BAD_REQUEST)

    order.status = 'cancelled'
    order.save()
    return Response({'message': 'Order cancelled successfully'})


class PlantSettingsView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = PlantSettingsSerializer

    def get_object(self):
        return PlantSettings.get_settings()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_public_settings(request):
    settings = PlantSettings.get_settings()
    return Response({
        'bottle_price': settings.bottle_price,
        'delivery_charge': settings.delivery_charge,
        'plant_name': settings.plant_name,
        'plant_phone': settings.plant_phone,
    })
