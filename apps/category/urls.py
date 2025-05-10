from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListCategoriesView, ListSeasonsWithCategoriesView, SeasonViewSet, ProductCategoryViewSet, SeasonViewSetProduct, CategoryViewSetProduct, SeasonDetailView, ProductCategoryDetailView, TallaDetailView, CategoryImageViewSet
from apps.product.views import SizeViewSetAdd

router = DefaultRouter()
router.register(r'seasons', SeasonViewSet)
router.register(r'categories', ProductCategoryViewSet)
router.register(r'categoryAdd', CategoryViewSetProduct, basename='category-product')
router.register(r'seasonAdd', SeasonViewSetProduct, basename='season-product')
router.register(r'sizeAdd', SizeViewSetAdd, basename='size-product')
router.register(r'category-images', CategoryImageViewSet, basename='categoryimage')

# GET /api/category-images/ → listar todas
# POST /api/category-images/ → crear una
# GET /api/category-images/<id>/ → ver una imagen específica
# PUT /api/category-images/<id>/ → editar
# DELETE /api/category-images/<id>/ → eliminar

urlpatterns = [
    path('api/category/', ListCategoriesView.as_view()),
    path('api/season/', ListSeasonsWithCategoriesView.as_view()),
    path('get/', include(router.urls)),

    path('season/<int:pk>/', SeasonDetailView.as_view(), name='season-detail'),
    path('product-category/<int:pk>/', ProductCategoryDetailView.as_view(), name='product-category-detail'),
    path('talla/<int:pk>/', TallaDetailView.as_view(), name='talla-detail'),
]