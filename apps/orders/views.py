from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Order, OrderItem
from rest_framework import viewsets
from .serializers import OrderSerializer, OrderItemSerializer
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.product.models import ProductColorStock, ProductTallaStock,ProductUnidad,Talla
from django.db import transaction
from apps.user.models import UserAccount
from .countries import Countries
from rest_framework_simplejwt.authentication import JWTAuthentication

from django.contrib.auth import get_user_model
User = get_user_model()
# LISTA DE ORDEN DE CADA USUARIO

class CountriesListView(APIView):
    def get(self, request):
        countries = [{"value": c.value, "label": c.label} for c in Countries]
        return Response(countries, status=status.HTTP_200_OK)
class ListOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user

        try:
            # Si es staff o superuser, trae todas las órdenes
            if user.is_staff or user.is_superuser:
                orders = Order.objects.all().order_by('-date_issued')
            else:
                # Si no, solo sus órdenes
                orders = Order.objects.filter(user=user).order_by('-date_issued')

            serializer = OrderSerializer(orders, many=True)

            return Response(
                {
                    'user_id': user.id,
                    'is_admin': user.is_staff or user.is_superuser,
                    'total_orders': orders.count(),
                    'orders': serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': f'Error al recuperar las órdenes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# detalle de cada orden,se psa la transacción(tanto admin y usuario)
class ListOrderDetailView(APIView):
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated]  

    def get(self, request, transactionId, format=None):
        user = request.user

        try:
            # Si el usuario es administrador o staff, puede ver cualquier orden
            if user.is_staff or user.is_superuser:
                order = get_object_or_404(Order, transaction_id=transactionId)
            else:
                order = get_object_or_404(Order, user=user, transaction_id=transactionId)

            # Serializar la orden con sus items
            order_serializer = OrderSerializer(order)

            return Response(order_serializer.data, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response(
                {'error': 'Orden no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {'error': f'Error al obtener el detalle de la orden: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

#lsita de ornen de cada cliente
class ListUserOrdersView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        user = request.user

        try:
            # Si es admin/staff puede consultar las órdenes de cualquier usuario
            if user.is_staff or user.is_superuser:
                target_user = get_object_or_404(User, id=user_id)
            else:
                # Usuario normal solo puede ver sus propias órdenes
                if user.id != user_id:
                    return Response(
                        {"error": "No tienes permiso para ver las órdenes de este usuario."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                target_user = user

            orders = Order.objects.filter(user=target_user).order_by('-date_issued')
            serializer = OrderSerializer(orders, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Ocurrió un error al obtener las órdenes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

#crear orden desde dash

# class CrearOrdenView(APIView):
#     permission_classes = [IsAuthenticated]

#     @transaction.atomic
#     def post(self, request):
#         if not request.user.is_staff and not request.user.is_superuser:
#             return Response(
#                 {"error": "No tienes permisos para realizar esta acción."},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         try:
#             data = request.data.copy()
#             items_data = data.pop("items", [])
#             cliente_id = data.get("user")

#             if not cliente_id:
#                 return Response(
#                     {"error": "El campo 'user' (ID del cliente) es obligatorio."},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             try:
#                 cliente = UserAccount.objects.get(id=cliente_id, is_staff=False, is_superuser=False)
#             except UserAccount.DoesNotExist:
#                 return Response(
#                     {"error": "El cliente proporcionado no es válido o no existe."},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             data["status"] = Order.OrderStatus.processed

#             total_amount = data.get("amount", 0)
#             if total_amount <= 0:
#                 return Response(
#                     {"error": "El campo 'amount' debe ser mayor a 0."},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             order_serializer = OrderSerializer(data=data)
#             order_serializer.is_valid(raise_exception=True)
#             order = order_serializer.save(user=cliente)

#             for item_data in items_data:
#                 product_id = item_data["product"]
#                 talla_id = item_data.get("talla")
#                 color = item_data.get("color")
#                 cantidad = item_data["count"]

#                 producto = ProductUnidad.objects.get(id=product_id)
#                 talla_nombre = None

#                 if talla_id:
#                     talla_stock = ProductTallaStock.objects.select_for_update().get(
#                         product=producto,
#                         talla_id=talla_id
#                     )
#                     if talla_stock.stock < cantidad:
#                         raise ValueError(f"Stock insuficiente para la talla del producto '{producto.name}'.")
#                     talla_stock.stock -= cantidad
#                     talla_stock.save()

#                     # Corregido: obtener el nombre de la talla usando 'cNombreTalla'
#                     talla_instancia = Talla.objects.get(id=talla_id)
#                     talla_nombre = talla_instancia.cNombreTalla

#                 elif color:
#                     color_stock = ProductColorStock.objects.select_for_update().get(
#                         product=producto,
#                         color=color
#                     )
#                     if color_stock.stock < cantidad:
#                         raise ValueError(f"Stock insuficiente para el color del producto '{producto.name}'.")
#                     color_stock.stock -= cantidad
#                     color_stock.save()

#                 else:
#                     raise ValueError(f"Debes proporcionar talla o color para el producto '{producto.name}'.")

#                 OrderItem.objects.create(
#                     order=order,
#                     product=producto,
#                     name=producto.name,
#                     price=producto.price,  # Aquí puedes ajustar con descuento si aplica
#                     count=cantidad,
#                     talla=talla_nombre,
#                     color=color if color else None
#                 )

#             return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

#         except ProductUnidad.DoesNotExist:
#             return Response({"error": "Producto no encontrado."}, status=status.HTTP_404_NOT_FOUND)
#         except ProductTallaStock.DoesNotExist:
#             return Response({"error": "Stock de talla no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
#         except ProductColorStock.DoesNotExist:
#             return Response({"error": "Stock de color no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
#         except Talla.DoesNotExist:
#             return Response({"error": "Talla no encontrada."}, status=status.HTTP_400_BAD_REQUEST)
#         except ValueError as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({"error": f"Error al crear la orden: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CrearOrdenView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"error": "No tienes permisos para realizar esta acción."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            data = request.data.copy()
            items_data = data.pop("items", [])
            cliente_id = data.get("user")

            if not cliente_id:
                return Response(
                    {"error": "El campo 'user' (ID del cliente) es obligatorio."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                cliente = UserAccount.objects.get(id=cliente_id, is_staff=False, is_superuser=False)
            except UserAccount.DoesNotExist:
                return Response(
                    {"error": "El cliente proporcionado no es válido o no existe."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            data["status"] = Order.OrderStatus.not_processed

            total_amount = data.get("amount", 0)
            if total_amount <= 0:
                return Response(
                    {"error": "El campo 'amount' debe ser mayor a 0."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order_serializer = OrderSerializer(data=data)
            order_serializer.is_valid(raise_exception=True)
            order = order_serializer.save(user=cliente)

            for item_data in items_data:
                product_id = item_data["product"]
                talla_id = item_data.get("talla")
                color = item_data.get("color")
                cantidad = item_data["count"]

                producto = ProductUnidad.objects.select_for_update().get(id=product_id)
                talla_nombre = None

                if talla_id:
                    talla_stock = ProductTallaStock.objects.select_for_update().get(
                        product=producto,
                        talla_id=talla_id
                    )
                    if talla_stock.stock < cantidad:
                        raise ValueError(f"Stock insuficiente para la talla del producto '{producto.name}'.")
                    talla_stock.stock -= cantidad
                    talla_stock.save()

                    talla_instancia = Talla.objects.get(id=talla_id)
                    talla_nombre = talla_instancia.cNombreTalla

                elif color:
                    color_stock = ProductColorStock.objects.select_for_update().get(
                        product=producto,
                        color=color
                    )
                    if color_stock.stock < cantidad:
                        raise ValueError(f"Stock insuficiente para el color del producto '{producto.name}'.")
                    color_stock.stock -= cantidad
                    color_stock.save()
                else:
                    raise ValueError(f"Debes proporcionar talla o color para el producto '{producto.name}'.")

                # 🔻 Descontar del stock general de ProductUnidad
                if producto.stock < cantidad:
                    raise ValueError(f"Stock total insuficiente para el producto '{producto.name}'.")
                producto.stock -= cantidad
                producto.save()

                OrderItem.objects.create(
                    order=order,
                    product=producto,
                    name=producto.name,
                    price=producto.price,  # Aquí puedes ajustar si hay promoción
                    count=cantidad,
                    talla=talla_nombre,
                    color=color if color else None
                )

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except ProductUnidad.DoesNotExist:
            return Response({"error": "Producto no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except ProductTallaStock.DoesNotExist:
            return Response({"error": "Stock de talla no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
        except ProductColorStock.DoesNotExist:
            return Response({"error": "Stock de color no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
        except Talla.DoesNotExist:
            return Response({"error": "Talla no encontrada."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error al crear la orden: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# crar ORDER ONLINE
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        order_data = request.data

        # Validación: Verificar si los datos de los items están presentes
        if 'items' not in order_data or len(order_data['items']) == 0:
            return Response({"error": "Debe proporcionar al menos un item para la orden."}, status=status.HTTP_400_BAD_REQUEST)

        # Crear la orden
        order_serializer = OrderSerializer(data=order_data)
        if order_serializer.is_valid():
            order = order_serializer.save()

            # Crear OrderItems si están presentes
            items_data = order_data.get('items')
            for item_data in items_data:
                item_data['order'] = order.id  # Asignar el ID de la orden a cada item
                item_serializer = OrderItemSerializer(data=item_data)
                if item_serializer.is_valid():
                    item_serializer.save()
                else:
                    return Response(item_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response(order_serializer.data, status=status.HTTP_201_CREATED)

        return Response(order_serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ActualizarStatusOrdenView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"error": "No tienes permisos para actualizar el estado."},
                status=status.HTTP_403_FORBIDDEN
            )

        transaction_id = request.data.get("transaction_id")
        nuevo_status = request.data.get("status")

        if not transaction_id or not nuevo_status:
            return Response(
                {"error": "Se requieren 'transaction_id' y 'status'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el nuevo status sea uno permitido
        if nuevo_status not in [choice[0] for choice in Order.OrderStatus.choices]:
            return Response(
                {"error": "El 'status' proporcionado no es válido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = Order.objects.select_for_update().get(transaction_id=transaction_id)
            order.status = nuevo_status
            order.save()

            return Response(
                {
                    "message": "Estado de la orden actualizado correctamente.",
                    "transaction_id": transaction_id,
                    "nuevo_status": nuevo_status
                },
                status=status.HTTP_200_OK
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Orden con ese transaction_id no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Error al actualizar el estado: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )    
