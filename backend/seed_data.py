"""
Run with: python manage.py shell < seed_data.py
Or: python seed_data.py (from within Django shell)
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.orders.models import Order, PlantSettings
import random
from django.utils import timezone
from datetime import timedelta

print("Seeding data...")

# Create Plant Settings
settings, _ = PlantSettings.objects.get_or_create(id=1, defaults={
    'bottle_price': 50.00,
    'delivery_charge': 20.00,
    'plant_name': 'Fiver Star Water Filter Plant',
    'plant_address': '123 Water Street, Karachi, Pakistan',
    'plant_phone': '+92-300-1234567',
})
print(f"Plant settings: {settings.plant_name}")

# Create Super Admin
super_admin, created = User.objects.get_or_create(
    email='superadmin@fiverstar.com',
    defaults={
        'full_name': 'Super Admin',
        'phone': '+92-300-0000001',
        'role': 'super_admin',
        'is_staff': True,
        'is_superuser': True,
    }
)
if created:
    super_admin.set_password('superadmin123')
    super_admin.save()
    print(f"Created super admin: {super_admin.email}")
else:
    print(f"Super admin already exists: {super_admin.email}")

# Create Admins
admin_data = [
    {'email': 'admin1@fiverstar.com', 'full_name': 'Admin One', 'phone': '+92-300-0000002'},
    {'email': 'admin2@fiverstar.com', 'full_name': 'Admin Two', 'phone': '+92-300-0000003'},
]

admins = []
for data in admin_data:
    admin, created = User.objects.get_or_create(
        email=data['email'],
        defaults={**data, 'role': 'admin', 'is_staff': True}
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print(f"Created admin: {admin.email}")
    admins.append(admin)

# Create Users
user_data = [
    {'email': 'user1@example.com', 'full_name': 'Ahmed Khan', 'phone': '+92-300-1111111', 'address': 'House 1, Block A, Karachi'},
    {'email': 'user2@example.com', 'full_name': 'Sara Ahmed', 'phone': '+92-300-2222222', 'address': 'House 5, Block B, Karachi'},
    {'email': 'user3@example.com', 'full_name': 'Ali Hassan', 'phone': '+92-300-3333333', 'address': 'House 10, Block C, Lahore'},
    {'email': 'user4@example.com', 'full_name': 'Fatima Malik', 'phone': '+92-300-4444444', 'address': 'House 15, Block D, Islamabad'},
    {'email': 'user5@example.com', 'full_name': 'Omar Sheikh', 'phone': '+92-300-5555555', 'address': 'House 20, Block E, Karachi'},
]

users = []
for data in user_data:
    user, created = User.objects.get_or_create(
        email=data['email'],
        defaults={**data, 'role': 'user'}
    )
    if created:
        user.set_password('user123')
        user.save()
        print(f"Created user: {user.email}")
    users.append(user)

# Create Orders
statuses = ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled']
order_types = ['pickup', 'delivery']
payment_statuses = ['unpaid', 'paid', 'partial']

print("Creating sample orders...")
for i in range(50):
    user = random.choice(users)
    order_type = random.choice(order_types)
    status = random.choice(statuses)
    quantity = random.randint(1, 10)

    days_ago = random.randint(0, 90)
    created_at = timezone.now() - timedelta(days=days_ago)

    order = Order(
        user=user,
        customer_name=user.full_name,
        phone=user.phone,
        address=user.address if order_type == 'delivery' else '',
        order_type=order_type,
        quantity=quantity,
        unit_price=settings.bottle_price,
        delivery_charge=settings.delivery_charge if order_type == 'delivery' else 0,
        status=status,
        payment_status='paid' if status == 'delivered' else random.choice(payment_statuses),
        notes=f"Sample order {i+1}",
    )
    order.save()
    # Override created_at
    Order.objects.filter(pk=order.pk).update(created_at=created_at)

print(f"Created {Order.objects.count()} orders")
print("\n=== Seed Data Complete ===")
print("\nLogin Credentials:")
print("Super Admin: superadmin@fiverstar.com / superadmin123")
print("Admin 1:     admin1@fiverstar.com / admin123")
print("Admin 2:     admin2@fiverstar.com / admin123")
print("User 1:      user1@example.com / user123")
print("User 2:      user2@example.com / user123")
