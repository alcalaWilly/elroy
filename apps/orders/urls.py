from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListOrdersView, ListOrderDetailView, OrderViewSet,CrearOrdenView,CountriesListView, ListUserOrdersView, ActualizarStatusOrdenView

# app_name = ""
router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('countries/', CountriesListView.as_view(), name='countries-list'),
    path('get-orders/', ListOrdersView.as_view(), name='get-orders'),  # Lista de órdenes del usuario
    path('get-order/<str:transactionId>/', ListOrderDetailView.as_view(), name='get-order'),  # Detalle de orden
    path('user/<int:user_id>/', ListUserOrdersView.as_view(), name='orders-by-user'),
    path('create-order/', CrearOrdenView.as_view(), name='create-order'),
    path('actualizar-status/', ActualizarStatusOrdenView.as_view(), name='actualizar-estado-orden'),


    path('', include(router.urls)),  # CRUD completo usando ViewSet
]