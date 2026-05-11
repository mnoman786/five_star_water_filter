import django_filters
from .models import Order


class OrderFilter(django_filters.FilterSet):
    created_at__gte = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at__lte = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    date = django_filters.DateFilter(field_name='created_at', lookup_expr='date')

    class Meta:
        model = Order
        fields = {
            'order_type': ['exact'],
            'status': ['exact'],
            'payment_status': ['exact'],
            'user': ['exact'],
        }
