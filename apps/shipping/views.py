from django.shortcuts import render
from .serializers import ShippingSerializer
from .models import Shipping
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

# Create your views here.
class ShippingViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny] 
    queryset = Shipping.objects.all()
    serializer_class = ShippingSerializer

    # Método adicional opcional para operaciones personalizadas
    @action(detail=True, methods=['get'])
    def custom_method(self, request, pk=None):
        shipping = self.get_object()
        return Response({'message': f'Custom action on {shipping.name}'})