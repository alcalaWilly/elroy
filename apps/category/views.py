from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from .models import ProductCategory, Season, CategoryImage
from rest_framework import viewsets
from .serializers import SeasonSerializer, ProductCategorySerializer, ProductCategorySerializerAdd, CategoryImageSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from apps.product.serializers import TallaSerializer
from apps.product.models import Talla
from django.db import transaction
import os



# Create your views here.
class ListCategoriesView(APIView):
    permission_classes = (permissions.AllowAny, )

    def get(self, request, format=None):
        categories = ProductCategory.objects.prefetch_related('subcategories').all()  # Usamos prefetch_related para cargar las subcategorías

        if categories.exists():
            result = []

            for category in categories:
                if not category.parent:
                    item = {
                        'id': category.id,
                        'name': category.name,
                        'sub_categories': []
                    }

                    # Filtramos las subcategorías de esta categoría
                    for sub_category in category.subcategories.all():
                        sub_item = {
                            'id': sub_category.id,
                            'name': sub_category.name,
                            'sub_categories': []  # Aquí se agregan las subcategorías si las hay
                        }
                        item['sub_categories'].append(sub_item)

                    result.append(item)

            return Response({'categories': result}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'No categories found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ListSeasonsWithCategoriesView(APIView):
    permission_classes = (permissions.AllowAny, )

    def get(self, request, format=None):
        seasons = Season.objects.prefetch_related('categories').all()  # Usamos prefetch_related para cargar las categorías relacionadas con las temporadas

        if seasons.exists():
            result = []

            for season in seasons:
                season_item = {
                    'id': season.id,
                    'name': season.name,
                    'description': season.description,
                    'categories': []
                }

                # Ya tenemos las categorías cargadas con prefetch_related, solo necesitamos iterar
                for category in season.categories.all():
                    category_item = {
                        'id': category.id,
                        'name': category.name,
                        'description': category.description,
                    }
                    season_item['categories'].append(category_item)

                result.append(season_item)

            return Response({'seasons': result}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'No seasons found'}, status=status.HTTP_404_NOT_FOUND)


class SeasonViewSetProduct(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication] # ✅ Autenticación con JWT
    permission_classes = [IsAuthenticated] # ✅ Solo usuarios autenticados pueden acceder
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer

class CategoryViewSetProduct(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = ProductCategory.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCategorySerializerAdd
        return ProductCategorySerializer

    def create(self, request, *args, **kwargs):
        serializer = ProductCategorySerializerAdd(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Guardar la categoría sin temporadas primero
        product_category = serializer.save()

        # Obtener los IDs de temporadas de la solicitud
        season_ids = request.data.get("seasons", [])

        if not season_ids:  # Si seasons está vacío ([])
            seasons = Season.objects.all()  # Obtener todas las temporadas
        else:
            seasons = Season.objects.filter(id__in=season_ids)  # Filtrar las temporadas enviadas

        product_category.seasons.set(seasons)  # Asignar temporadas

        return Response(ProductCategorySerializer(product_category).data, status=status.HTTP_201_CREATED)


class SeasonViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.AllowAny, )
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer

class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.AllowAny, )
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer


# ########################################
class SeasonDetailView(generics.RetrieveAPIView):
    authentication_classes = [JWTAuthentication] # ✅ Autenticación con JWT
    permission_classes = [IsAuthenticated]  
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer

class ProductCategoryDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer

class TallaDetailView(generics.RetrieveUpdateAPIView):
    """
    Vista para obtener y actualizar una talla específica.
    """
    authentication_classes = [JWTAuthentication] # ✅ Autenticación con JWT
    permission_classes = [IsAuthenticated]      
    queryset = Talla.objects.all()
    serializer_class = TallaSerializer



class CategoryImageViewSet(viewsets.ModelViewSet):
    queryset = CategoryImage.objects.all()
    serializer_class = CategoryImageSerializer

    def create(self, request, *args, **kwargs):
        is_many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_bulk_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def perform_bulk_create(self, serializer):
        # Asumimos que el serializer.validated_data ya está validado
        validated_data_list = serializer.validated_data if isinstance(serializer.validated_data, list) else [serializer.validated_data]

        for validated_data in validated_data_list:
            category = validated_data.get('category')
            if category:
                # Buscar una imagen existente para la misma categoría
                existing = CategoryImage.objects.filter(category=category).first()
                if existing:
                    # Borrar el archivo físico de imagen si existe
                    if existing.image and os.path.isfile(existing.image.path):
                        os.remove(existing.image.path)
                    # Borrar el objeto de base de datos
                    existing.delete()

        # Finalmente guardar el nuevo registro
        serializer.save()







