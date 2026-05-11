from rest_framework import serializers
from .models import Order, PlantSettings
from apps.users.serializers import UserListSerializer


class OrderSerializer(serializers.ModelSerializer):
    user_details = UserListSerializer(source='user', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_type_display = serializers.CharField(source='get_order_type_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'user', 'user_details', 'customer_name', 'phone',
            'address', 'order_type', 'order_type_display', 'quantity',
            'unit_price', 'delivery_charge', 'total_price', 'status',
            'status_display', 'payment_status', 'payment_status_display',
            'notes', 'assigned_to', 'created_at', 'updated_at', 'delivered_at'
        ]
        read_only_fields = ['id', 'order_id', 'total_price', 'created_at', 'updated_at']

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'customer_name', 'phone', 'address', 'order_type',
            'quantity', 'unit_price', 'delivery_charge', 'notes'
        ]

    def validate(self, data):
        if data.get('order_type') == 'delivery' and not data.get('address'):
            raise serializers.ValidationError({'address': 'Address is required for delivery orders.'})
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        settings = PlantSettings.get_settings()
        validated_data['unit_price'] = validated_data.get('unit_price', settings.bottle_price)
        if validated_data.get('order_type') == 'delivery':
            validated_data['delivery_charge'] = validated_data.get('delivery_charge', settings.delivery_charge)
        else:
            validated_data['delivery_charge'] = 0
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'payment_status', 'notes']

    def update(self, instance, validated_data):
        from django.utils import timezone
        if validated_data.get('status') == 'delivered' and instance.status != 'delivered':
            validated_data['delivered_at'] = timezone.now()
        return super().update(instance, validated_data)


class PlantSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantSettings
        fields = ['id', 'bottle_price', 'delivery_charge', 'plant_name', 'plant_address', 'plant_phone', 'updated_at']
        read_only_fields = ['id', 'updated_at']
