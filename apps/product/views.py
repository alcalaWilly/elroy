from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import permissions, status
# Create your views here.
from django.db import connection, transaction
from .serializers import  ProductUnidadSerializer, TallaSerializer, PromotionsSerializer, TallasSerializer, TallaStockSerializer, ViewTallaStockSerializer, ProductUnidadDetalleSerializer, ProductColorStockSerializer,ProductUnidadUpdateSerializer, PromotionSerializer, BanerInicioSerializer, CarruselProductoSerializer
from .models import ProductUnidad, Promotion, Talla, ImagenProducto, ProductTallaStock, ProductColorStock, BanerInicio, CarruselProducto
from apps.category.models import ProductCategory
from django.db.models import Prefetch
from django.db.models import Min
import json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from rest_framework.parsers import JSONParser
from django.core.files.base import ContentFile
import base64
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.generics import RetrieveUpdateAPIView



def product_details(request):
    return render(request, 'shop/details.html')

def product_checkout(request):
    return render(request, 'shop/checkout.html')

class SizeViewSetAdd(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication] # ✅ Autenticación con JWT
    permission_classes = [IsAuthenticated] # ✅ Solo usuarios autenticados pueden acceder
    queryset = Talla.objects.all()
    serializer_class = TallaSerializer

class ProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, productId, format=None):
        try:
            product_id = int(productId)
        except ValueError:
            return Response(
                {'error': 'El ID del producto debe ser un número entero'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(
            ProductUnidad.objects.select_related('category', 'season')
            .prefetch_related(
                'imagenproducto_set',
                Prefetch('promotions', queryset=Promotion.objects.filter(active=True))
            ), 
            id=product_id
        )

        # Obtener las tallas y colores del producto
        tallas = ProductTallaStock.objects.filter(product=product).select_related('talla')
        colores = ProductColorStock.objects.filter(product=product)

        # Serializar producto, tallas y colores por separado
        product_serializer = ProductUnidadDetalleSerializer(product)
        talla_serializer = ViewTallaStockSerializer(tallas, many=True)
        color_serializer = ProductColorStockSerializer(colores, many=True)

        return Response({
            'product': product_serializer.data,
            'tallas': talla_serializer.data,  # Agregar las tallas como un campo separado
            'colores': color_serializer.data  # Agregar los colores como un campo separado
        }, status=status.HTTP_200_OK)


class ListProductsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, format=None):
        # Obtener parámetros de consulta
        sortBy = request.query_params.get('sortBy', 'date_created')  # Ordenar por
        order = request.query_params.get('order', 'asc')  # Orden ascendente o descendente
        show_new_products = request.query_params.get('new', None)  # Productos nuevos
        show_promotions = request.query_params.get('promotions', None)  # Productos con promociones
        category_id = request.query_params.get('category', None)  # Filtrar por categoría
        show_with_colors = request.query_params.get('with_colors', None)  # Productos con colores disponibles

        # Validar y ajustar el campo de ordenamiento
        valid_sort_fields = ['date_created', 'price', 'name']
        if sortBy not in valid_sort_fields:
            sortBy = 'date_created'

        # Ajustar el orden (ascendente o descendente)
        sort_order = '-' + sortBy if order == 'desc' else sortBy

        # Construir la consulta base
        products_query = ProductUnidad.objects.prefetch_related(
            Prefetch(
                'promotions',
                queryset=Promotion.objects.filter(active=True)
            ),
            Prefetch(
                'talla_stock',  # Se usa el related_name correcto de ProductTallaStock
                queryset=ProductTallaStock.objects.select_related('talla')
            ),
            Prefetch(
                'color_stock',  # Se usa el related_name correcto de ProductColorStock
                queryset=ProductColorStock.objects.all()
            )
        )

        # Filtrar según categoría si se especifica
        if category_id:
            products_query = products_query.filter(category__id=category_id)

        # Filtrar según `new`
        if show_new_products == 'true':
            products_query = products_query.filter(
                Q(promotions__isnull=True) | Q(promotions__code__gt='')  # Código no vacío
            ).distinct()

        # Filtrar según `promotions`
        elif show_promotions == 'true':
            products_query = products_query.filter(
                promotions__isnull=False,
                promotions__code=''
            ).distinct()

        # Filtrar productos que tienen colores disponibles
        if show_with_colors == 'true':
            products_query = products_query.filter(color_stock__isnull=False).distinct()

        # Obtener productos ordenados
        products = products_query.order_by(sort_order)

        # Serializar productos
        serialized_products = ProductUnidadDetalleSerializer(products, many=True).data

        # Agregar las tallas y colores de cada producto en la respuesta
        for product_data in serialized_products:
            product_id = product_data['id']

            # Obtener y serializar tallas
            tallas = ProductTallaStock.objects.filter(product_id=product_id).select_related('talla')
            talla_serializer = ViewTallaStockSerializer(tallas, many=True)
            product_data['tallas'] = talla_serializer.data

            # Obtener y serializar colores
            colores = ProductColorStock.objects.filter(product_id=product_id)
            color_serializer = ProductColorStockSerializer(colores, many=True)
            product_data['colores'] = color_serializer.data

        # Retornar respuesta
        if serialized_products:
            return Response({'products': serialized_products}, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'No products to list'},
                status=status.HTTP_404_NOT_FOUND
            )


class ListSearchView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        data = self.request.data

        try:
            category_id = int(data.get('category_id', 0))  # Obtener el ID de categoría
        except ValueError:
            return Response(
                {'error': 'Category ID must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        search = data.get('search', '').strip()  # Obtener el término de búsqueda

        # Si no hay un término de búsqueda, obtener todos los productos
        if not search:
            search_results = ProductUnidad.objects.order_by('-date_created').all()
        else:
            # Buscar productos por nombre o descripción
            search_results = ProductUnidad.objects.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Si hay una categoría específica, filtramos por ella
        if category_id != 0:
            search_results = search_results.filter(category_id=category_id)

        # Obtener productos únicos por nombre (el de menor ID de cada grupo)
        unique_products = search_results.values('name').annotate(
            min_id=Min('id')
        ).values_list('min_id', flat=True)

        # Filtrar la lista de productos para obtener solo los productos únicos
        search_results = ProductUnidad.objects.filter(id__in=unique_products).order_by('-date_created')

        # Serializar los productos únicos
        serialized_results = ProductUnidadSerializer(search_results, many=True)

        return Response({'search_products': serialized_results.data}, status=status.HTTP_200_OK)

class ListSizesByNameView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, productId, format=None):
        try:
            # Validar que el productId sea un entero
            product_id = int(productId)
        except ValueError:
            return Response(
                {'error': 'Product ID must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar si el producto existe
        try:
            product = ProductUnidad.objects.get(id=product_id)
        except ProductUnidad.DoesNotExist:
            return Response(
                {'error': 'Product with this ID does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener el nombre del producto capturado
        product_name = product.name

        # Verificar que el nombre no esté vacío
        if product_name:
            # Obtener todos los productos con el mismo nombre
            products_with_same_name = ProductUnidad.objects.filter(name=product_name)

            # Obtener las tallas relacionadas con esos productos
            sizes = []
            for p in products_with_same_name:
                if p.talla:  # Verificar si el producto tiene tallas asociadas
                    sizes.append(p.talla)

            # Serializar las tallas obtenidas
            serialized_sizes = TallaSerializer(sizes, many=True)

            return Response(
                {'sizes': serialized_sizes.data},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'The product does not have a name'},
                status=status.HTTP_400_BAD_REQUEST
            )

class ListColorsByNameView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, productId, format=None):
        try:
            # Validar que el productId sea un entero
            product_id = int(productId)
        except ValueError:
            return Response(
                {'error': 'Product ID must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar si el producto existe
        try:
            product = ProductUnidad.objects.get(id=product_id)
        except ProductUnidad.DoesNotExist:
            return Response(
                {'error': 'Product with this ID does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener el nombre del producto capturado
        product_name = product.name

        # Verificar que el nombre no esté vacío
        if product_name:
            # Obtener todos los productos con el mismo nombre
            products_with_same_name = ProductUnidad.objects.filter(name=product_name)

            # Obtener los colores únicos relacionados con esos productos
            colors = list(set(p.color for p in products_with_same_name if p.color))

            return Response(
                {'colors': colors},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'The product does not have a name'},
                status=status.HTTP_400_BAD_REQUEST
            )

class ListBySearchView(APIView):
    permission_classes = (permissions.AllowAny, )

    def post(self, request, format=None):
        data = self.request.data

        # Obtener los filtros opcionales
        seasons = data.get('seasons', [])  # IDs de temporadas seleccionadas
        categories = data.get('categories', [])  # IDs de categorías seleccionadas
        min_price = data.get('min_price')  # Precio mínimo
        max_price = data.get('max_price')  # Precio máximo

        # Base de productos
        product_results = ProductUnidad.objects.all()

        # Aplicar filtro por temporadas si se proporciona
        if seasons:
            product_results = product_results.filter(season__id__in=seasons)

        # Aplicar filtro por categorías si se proporciona
        if categories:
            product_results = product_results.filter(category__id__in=categories)

        # Aplicar filtro por precio mínimo si se proporciona
        if min_price is not None:
            try:
                min_price = float(min_price)
                product_results = product_results.filter(price__gte=min_price)
            except ValueError:
                return Response(
                    {'error': 'min_price debe ser un número válido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Aplicar filtro por precio máximo si se proporciona
        if max_price is not None:
            try:
                max_price = float(max_price)
                product_results = product_results.filter(price__lte=max_price)
            except ValueError:
                return Response(
                    {'error': 'max_price debe ser un número válido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Agrupar por nombre y seleccionar un solo producto por cada nombre
        unique_products = product_results.values('name').annotate(
            min_id=Min('id')  # Seleccionar el producto con el ID más bajo de cada grupo
        ).values_list('min_id', flat=True)

        # Filtrar la lista de productos para obtener solo los productos únicos
        product_results = ProductUnidad.objects.filter(id__in=unique_products).order_by('-date_created')

        # Serializar los productos filtrados
        serialized_products = ProductUnidadSerializer(product_results, many=True)

        # Responder con los productos filtrados
        if serialized_products.data:
            return Response(
                {'filtered_products': serialized_products.data},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'No se encontraron productos que coincidan con los filtros proporcionados.'},
                status=status.HTTP_200_OK
            )


class PromotionAddViewSet(viewsets.ModelViewSet):
    """
    API para listar, crear, actualizar y eliminar promociones.
    """
    authentication_classes = [JWTAuthentication]  # ✅ Autenticación con JWT
    permission_classes = [IsAuthenticated]  # ✅ Solo usuarios autenticados pueden acceder
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    
class PromotionsViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer

class TallasViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.AllowAny, )
    queryset = Talla.objects.all()
    serializer_class = TallasSerializer

#PARA AGREGAR
class BanerInicioViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = BanerInicio.objects.all()
    serializer_class = BanerInicioSerializer

#PARA SOLO VER
class PublicBanerInicioViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]  # Permite acceso sin autenticación
    queryset = BanerInicio.objects.all()
    serializer_class = BanerInicioSerializer


# Vista para listar todos los productos (sin autenticación)
class CarruselProductoListView(ListAPIView):
    permission_classes = [AllowAny]  # Permitir acceso a cualquier usuario
    queryset = CarruselProducto.objects.all()
    serializer_class = CarruselProductoSerializer

# Vista para crear un nuevo producto (requiere autenticación)
class CarruselProductoCreateView(ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = CarruselProducto.objects.all()
    serializer_class = CarruselProductoSerializer

# Vista para obtener, actualizar o eliminar un producto específico (requiere autenticación)
class CarruselProductoDetailView(RetrieveUpdateDestroyAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = CarruselProducto.objects.all()
    serializer_class = CarruselProductoSerializer
# class BanerInicioViewSet(generics.CreateAPIView):
#     queryset = BanerInicio.objects.all()
#     serializer_class = BanerInicioSerializer

class CarruselProductoUpdateView(RetrieveUpdateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = CarruselProducto.objects.all()
    serializer_class = CarruselProductoSerializer

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def save_products(request):
    data = request.data

    if isinstance(data, dict):  
        data = [data]

    if not isinstance(data, list):
        return Response({"error": "Se esperaba un producto o una lista de productos."}, status=status.HTTP_400_BAD_REQUEST)

    productos_guardados = []
    errores = []

    for producto_data in data:
        try:
            producto_data["category"] = int(producto_data["category"])
            producto_data["season"] = int(producto_data["season"])

            # Extraer imágenes de objetos con "url"
            if "imagenes" in producto_data:
                producto_data["imagenes_data"] = [img["url"] for img in producto_data["imagenes"]]

            # Asegurar que colores siempre sea una lista
            producto_data["colores"] = producto_data.get("colores", [])  

        except (ValueError, TypeError):
            errores.append({"producto": producto_data, "error": "Category o Season no son válidos."})
            continue

        serializer = ProductUnidadSerializer(data=producto_data)

        if serializer.is_valid():
            try:
                producto = serializer.save()
                productos_guardados.append(ProductUnidadSerializer(producto).data)

            except Exception as e:
                errores.append({"producto": producto_data, "error": str(e)})
        else:
            errores.append({"producto": producto_data, "error": serializer.errors})

    if errores:
        return Response({"errors": errores}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"productos": productos_guardados}, status=status.HTTP_201_CREATED)


class ProductTallasView(APIView):
    permission_classes = (permissions.AllowAny, )
    def get(self, request, product_id):
        product = get_object_or_404(ProductUnidad, id=product_id)
        tallas = ProductTallaStock.objects.filter(product=product)
        serializer = ViewTallaStockSerializer(tallas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def update_product(request):
    data = request.data
    data = [data] if isinstance(data, dict) else data  # Convertir en lista si es un solo producto
    
    if not isinstance(data, list):
        return Response({"error": "Se esperaba un producto o una lista de productos."}, status=status.HTTP_400_BAD_REQUEST)
    
    productos_actualizados, productos_creados, errores = [], [], []

    for producto_data in data:
        product_id = producto_data.get("id")
        
        try:
            with transaction.atomic():
                producto = ProductUnidad.objects.filter(id=product_id).first()
                action = "actualizado" if producto else "creado"
                
                # ✅ Manejo de Promociones (Convertir ID en objeto completo si existe)
                # ✅ Manejo de Promociones (Reemplazo completo)
                # ✅ Manejo de Promoción Única (en lugar de múltiples)
                if "promotions" in producto_data and isinstance(producto_data["promotions"], list):
                    promociones_ids = producto_data["promotions"]

                    print("📌 Promotions enviados en el request:", promociones_ids)  # Depuración

                    if len(promociones_ids) > 1:
                        errores.append({"producto": producto_data, "error": "Solo se permite una promoción a la vez."})
                        continue  # Salta este producto y sigue con el siguiente

                    if len(promociones_ids) == 1 and isinstance(promociones_ids[0], int):
                        promocion = Promotion.objects.filter(id=promociones_ids[0]).first()

                        if promocion:
                            print("✅ Promoción encontrada en la BD:", promocion)  # Depuración

                            if producto:  # Asegurar que el producto existe antes de modificar
                                producto.promotions.set([promocion])  # ✅ Corrección: asignar solo una promoción

                        else:
                            errores.append({"producto": producto_data, "error": f"La promoción con ID {promociones_ids[0]} no existe."})


                serializer = ProductUnidadUpdateSerializer(producto, data=producto_data, partial=True)
                if serializer.is_valid():
                    producto_guardado = serializer.save()
                    
                    # ✅ Manejo de Tallas
                    tallas_data = producto_data.get("tallas", [])
                    ProductTallaStock.objects.filter(product=producto_guardado).delete()
                    ProductTallaStock.objects.bulk_create([
                        ProductTallaStock(product=producto_guardado, talla_id=t["talla"], stock=t["stock"]) 
                        for t in tallas_data if "talla" in t
                    ])

                    # ✅ Manejo de Colores
                    colores_data = producto_data.get("colores", [])
                    ProductColorStock.objects.filter(product=producto_guardado).delete()
                    ProductColorStock.objects.bulk_create([
                        ProductColorStock(product=producto_guardado, color=c["color"], stock=c["stock"]) 
                        for c in colores_data if "color" in c
                    ])

                    # ✅ Manejo de Imágenes sin eliminar las existentes
                    imagenes_data = producto_data.get("imagenes", [])

                    if imagenes_data:
                        imagenes_existentes_ids = [img["id"] for img in imagenes_data if img.get("id") is not None]

                        # 🔥 Solo elimina imágenes que ya no están en la nueva lista
                        producto_guardado.imagenproducto_set.exclude(id__in=imagenes_existentes_ids).delete()

                        for image_data in imagenes_data:
                            image_id = image_data.get("id")
                            image_src = image_data.get("src")

                            if image_id is None and image_src.startswith("data:image"):  
                                # ✅ Guarda la imagen en la BD solo si es nueva
                                nueva_imagen = ImagenProducto.save_base64_image(image_src, producto_guardado)

                                if nueva_imagen:
                                    nueva_imagen.producto = producto_guardado
                                    nueva_imagen.save()
                                else:
                                    raise serializers.ValidationError({"error": "No se pudo guardar la imagen base64."})

                    # ✅ Retornar el producto con los cambios actualizados
                    (productos_actualizados if action == "actualizado" else productos_creados).append(
                        ProductUnidadUpdateSerializer(producto_guardado).data
                    )
                else:
                    errores.append({"producto": producto_data, "error": serializer.errors})
        except Exception as e:
            errores.append({"producto": producto_data, "error": str(e)})

    response_data = {"productos_actualizados": productos_actualizados, "productos_creados": productos_creados}
    if errores:
        response_data["errors"] = errores
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(response_data, status=status.HTTP_200_OK)












