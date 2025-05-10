from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShippingViewSet
# Crear el router y registrar la vista
router = DefaultRouter()
router.register(r'shipping', ShippingViewSet)  # El prefijo 'shipping' se usará en la URL

urlpatterns = [
    path('', include(router.urls)),  # Incluye todas las rutas generadas por el router
]