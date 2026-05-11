from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
from apps.users.models import User, ActivityLog
from apps.orders.models import Order
from apps.users.permissions import IsSuperAdmin, IsAdminOrSuperAdmin


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def super_admin_dashboard(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)

    # Today stats
    today_orders = Order.objects.filter(created_at__date=today)
    today_earnings = today_orders.filter(
        payment_status='paid'
    ).aggregate(total=Sum('total_price'))['total'] or 0

    # Total stats
    total_earnings = Order.objects.filter(
        payment_status='paid'
    ).aggregate(total=Sum('total_price'))['total'] or 0

    # Order counts
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    delivered_orders = Order.objects.filter(status='delivered').count()
    pickup_orders = Order.objects.filter(order_type='pickup').count()
    delivery_orders = Order.objects.filter(order_type='delivery').count()
    processing_orders = Order.objects.filter(status='processing').count()
    out_for_delivery_orders = Order.objects.filter(status='out_for_delivery').count()

    # User stats
    total_customers = User.objects.filter(role='user').count()
    total_admins = User.objects.filter(role='admin').count()

    # Monthly data (last 6 months)
    monthly_data = []
    for i in range(5, -1, -1):
        month_date = today - timedelta(days=30 * i)
        month_orders = Order.objects.filter(
            created_at__year=month_date.year,
            created_at__month=month_date.month
        )
        monthly_data.append({
            'month': month_date.strftime('%b %Y'),
            'orders': month_orders.count(),
            'earnings': float(
                month_orders.filter(payment_status='paid')
                .aggregate(total=Sum('total_price'))['total'] or 0
            )
        })

    # Recent orders
    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
    recent_orders_data = [
        {
            'id': o.id,
            'order_id': o.order_id,
            'customer_name': o.customer_name,
            'phone': o.phone,
            'order_type': o.order_type,
            'quantity': o.quantity,
            'total_price': float(o.total_price),
            'status': o.status,
            'payment_status': o.payment_status,
            'created_at': o.created_at.isoformat(),
        }
        for o in recent_orders
    ]

    # Recent activities
    activities = ActivityLog.objects.select_related('user').order_by('-created_at')[:10]
    activities_data = [
        {
            'id': a.id,
            'user': a.user.full_name if a.user else 'System',
            'action': a.action,
            'description': a.description,
            'created_at': a.created_at.isoformat(),
        }
        for a in activities
    ]

    return Response({
        'today_earnings': float(today_earnings),
        'total_earnings': float(total_earnings),
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'delivered_orders': delivered_orders,
        'pickup_orders': pickup_orders,
        'delivery_orders': delivery_orders,
        'processing_orders': processing_orders,
        'out_for_delivery_orders': out_for_delivery_orders,
        'total_customers': total_customers,
        'total_admins': total_admins,
        'monthly_data': monthly_data,
        'recent_orders': recent_orders_data,
        'recent_activities': activities_data,
    })


@api_view(['GET'])
@permission_classes([IsAdminOrSuperAdmin])
def admin_dashboard(request):
    today = timezone.now().date()

    today_orders = Order.objects.filter(created_at__date=today)
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    delivered_orders = Order.objects.filter(status='delivered').count()
    pickup_orders = Order.objects.filter(order_type='pickup').count()
    delivery_orders = Order.objects.filter(order_type='delivery').count()
    out_for_delivery = Order.objects.filter(status='out_for_delivery').count()

    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
    recent_orders_data = [
        {
            'id': o.id,
            'order_id': o.order_id,
            'customer_name': o.customer_name,
            'phone': o.phone,
            'order_type': o.order_type,
            'quantity': o.quantity,
            'total_price': float(o.total_price),
            'status': o.status,
            'payment_status': o.payment_status,
            'created_at': o.created_at.isoformat(),
        }
        for o in recent_orders
    ]

    return Response({
        'today_orders': today_orders.count(),
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'delivered_orders': delivered_orders,
        'pickup_orders': pickup_orders,
        'delivery_orders': delivery_orders,
        'out_for_delivery': out_for_delivery,
        'recent_orders': recent_orders_data,
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def export_report(request):
    from django.http import HttpResponse
    import csv
    from io import StringIO

    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    orders = Order.objects.select_related('user').all()
    if date_from:
        orders = orders.filter(created_at__date__gte=date_from)
    if date_to:
        orders = orders.filter(created_at__date__lte=date_to)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Order ID', 'Customer Name', 'Phone', 'Address',
        'Order Type', 'Quantity', 'Unit Price', 'Delivery Charge',
        'Total Price', 'Status', 'Payment Status', 'Created At'
    ])

    for order in orders:
        writer.writerow([
            order.order_id, order.customer_name, order.phone, order.address,
            order.get_order_type_display(), order.quantity,
            order.unit_price, order.delivery_charge, order.total_price,
            order.get_status_display(), order.get_payment_status_display(),
            order.created_at.strftime('%Y-%m-%d %H:%M')
        ])

    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="orders_report.csv"'
    return response
