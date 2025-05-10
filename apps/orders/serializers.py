# serializers.py
from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'name', 'price', 'count', 'date_added','talla', 'color']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True, source='orderitem_set')

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'user', 'transaction_id', 'amount', 'full_name',
            'address_line_1', 'address_line_2', 'city', 'state_province_region',
            'postal_zip_code', 'country_region', 'telephone_number',
            'shipping_name', 'shipping_time', 'shipping_price', 'date_issued', 'items'
        ]
