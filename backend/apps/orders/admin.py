from django.contrib import admin
from .models import Order, PlantSettings


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_id', 'customer_name', 'phone', 'order_type',
        'quantity', 'total_price', 'status', 'payment_status', 'created_at'
    )
    list_filter = ('order_type', 'status', 'payment_status', 'created_at')
    search_fields = ('order_id', 'customer_name', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('order_id', 'created_at', 'updated_at')

    fieldsets = (
        ('Order Info', {'fields': ('order_id', 'order_type', 'status', 'payment_status')}),
        ('Customer Info', {'fields': ('user', 'customer_name', 'phone', 'address')}),
        ('Pricing', {'fields': ('quantity', 'unit_price', 'delivery_charge', 'total_price')}),
        ('Notes', {'fields': ('notes', 'assigned_to')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'delivered_at')}),
    )


@admin.register(PlantSettings)
class PlantSettingsAdmin(admin.ModelAdmin):
    list_display = ('plant_name', 'bottle_price', 'delivery_charge', 'updated_at')
