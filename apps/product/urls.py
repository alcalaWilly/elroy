from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import ProductDetailView, ListProductsView, ListSearchView, ListBySearchView, product_details, ListSizesByNameView, ListColorsByNameView, PromotionsViewSet, TallasViewSet, save_products, ProductTallasView, update_product,PromotionAddViewSet, BanerInicioViewSet, PublicBanerInicioViewSet, CarruselProductoDetailView,CarruselProductoListView , CarruselProductoCreateView, CarruselProductoUpdateView

app_name='product'

router = DefaultRouter()
#router.register(r'promociones', PromotionsViewSet)
router.register(r'sizes', TallasViewSet)
# router.register(r'promotionsAdd', PromotionAddViewSet)
router.register(r'promociones', PromotionsViewSet, basename='promociones')
router.register(r'promotionsAdd', PromotionAddViewSet, basename='promotions-add')
#PARA EL BANNER DEL INICIO
router.register(r'banerinicio-publico', PublicBanerInicioViewSet, basename='banerinicio-publico')




urlpatterns = [
    path('product/<productId>', ProductDetailView.as_view()), #
    path('get-products/', ListProductsView.as_view()), 
    ##########listar productos################
    # ?sortBy=price&order=asc/order --> todos los productos ordenados por precio (ascendente=asc):
    # ?new=true --> todos los productos nuevos
    # ?promotions=true --> todos los productos con promociones
    # ?promotions=true&sortBy=name&order=desc --> Listar productos con promociones activas y ordenar por nombre (descendente)
    path('search', ListSearchView.as_view()), #buscar productos
    path('sizeReleated/<productId>', ListSizesByNameView.as_view()),#buscar productos relacionados
    path('colorsReleated/<productId>', ListColorsByNameView.as_view()),#buscar productos relacionados
    path('by/search', ListBySearchView.as_view()), #buscar con diferente filtros
    

    path('shop/details/', views.product_details, name='product_details'),
    path('shop/checkouts/', views.product_checkout, name='product_checkouts'),
    path('get/', include(router.urls)),

    path('productos/<int:product_id>/tallas/', ProductTallasView.as_view(), name='product-tallas'),


    path('save_product/', save_products, name='save_product'),
    path('update_product/', update_product, name='update_product'),
    # path('/about/', views.about, name='about'),
    # path('/contact/', views.contact, name='contact'),
    path('api/banerinicio/', BanerInicioViewSet.as_view({'get': 'list', 'post': 'create'}), name='banerinicio-list'),
    
    path('api/banerinicio/<int:pk>/', BanerInicioViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='banerinicio-detail'),

    path('carrusel-productos/', CarruselProductoListView.as_view(), name='carrusel-producto-list'),
    path('carrusel-productos/create/', CarruselProductoCreateView.as_view(), name='carrusel-producto-create'),
    path('carrusel-productos/<int:pk>/', CarruselProductoDetailView.as_view(), name='carrusel-producto-detail'),
    path('carrusel-productos/<int:pk>/', CarruselProductoUpdateView.as_view(), name='carrusel-producto-update'),



]