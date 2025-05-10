from rest_framework import serializers
from django.core.files.base import ContentFile
import base64
from .models import Talla, ProductUnidad, ImagenProducto, Promotion, ProductTallaStock, ProductColorStock, BanerInicio, CarruselProducto
from apps.category.models import Season, ProductCategory
import uuid
from drf_extra_fields.fields import Base64ImageField



class TallaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Talla
        fields = '__all__'

    def update(self, instance, validated_data):
        # Actualiza cada campo con los datos validados
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class TallaStockSerializer(serializers.ModelSerializer):
    talla = serializers.PrimaryKeyRelatedField(queryset=Talla.objects.all())

    class Meta:
        model = ProductTallaStock
        fields = ['talla', 'stock']


class ProductColorStockSerializer(serializers.ModelSerializer):
    # ❌ Esto genera el error porque `talla` no existe en ProductColorStock
    # talla = serializers.PrimaryKeyRelatedField(queryset=Talla.objects.all())  

    class Meta:
        model = ProductColorStock
        fields = ['color', 'stock'] 


class ViewTallaStockSerializer(serializers.ModelSerializer):
    talla = TallaSerializer()  # 🔥 Esto mostrará toda la info de la talla

    class Meta:
        model = ProductTallaStock
        fields = ['id', 'talla', 'stock']


class ProductUnidadListSerializer(serializers.ListSerializer):
    def create(self, validated_data):
        productos = []
        for data in validated_data:
            productos.append(ProductUnidadSerializer().create(data))
        return productos

class ImagenProductoSerializer(serializers.ModelSerializer):
    base64_image = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = ImagenProducto
        fields = ['id', 'producto', 'cRutaImagen', 'bEsActivo', 'dFechaCreacion', 'base64_image']

    def create(self, validated_data):
        base64_image = validated_data.pop('base64_image', None)
        producto = validated_data.get('producto')

        # ✅ Guardar imagen con el método estático `save_base64_image()`
        if base64_image and producto:
            imagen = ImagenProducto.save_base64_image(base64_image, producto)
            if imagen:
                return imagen
        return None


# class PromotionSerializer(serializers.ModelSerializer):
#     start_date = serializers.DateTimeField(required=False, allow_null=True)
#     end_date = serializers.DateTimeField(required=False, allow_null=True)
#     code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
#     products = serializers.PrimaryKeyRelatedField(
#         queryset=ProductUnidad.objects.all(),
#         many=True,
#         required=False
#     )
#     usage_limit = serializers.IntegerField(
#         required=False, allow_null=True, default=None,
#         help_text="Número de veces que puede ser usado el descuento. Deja vacío para sin límite."
#     )

#     class Meta:
#         model = Promotion
#         fields = "__all__"

#     def validate(self, data):
#         start_date = data.get("start_date")
#         end_date = data.get("end_date")

#         # Convertir "" en None para end_date y usage_limit si llegan como string vacío
#         if isinstance(end_date, str) and end_date.strip() == "":
#             data["end_date"] = None

#         usage_limit = data.get("usage_limit")
#         if isinstance(usage_limit, str) and usage_limit.strip() == "":
#             data["usage_limit"] = None

#         # Si start_date y end_date son iguales, los anulamos
#         if start_date and data["end_date"] and start_date == data["end_date"]:
#             data["start_date"] = None
#             data["end_date"] = None

#         return data

#     def create(self, validated_data):
#         products = validated_data.pop("products", None)
#         promotion = Promotion.objects.create(**validated_data)

#         if products:
#             for product in products:
#                 product.promotions.add(promotion)

#         return promotion

#     def update(self, instance, validated_data):
#         products = validated_data.pop("products", None)
#         instance = super().update(instance, validated_data)

#         if products is not None:
#             for product in products:
#                 product.promotions.add(instance)

#         return instance

class PromotionSerializer(serializers.ModelSerializer):
    start_date = serializers.DateTimeField(required=False, allow_null=True)
    end_date = serializers.DateTimeField(required=False, allow_null=True)
    code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Este se usa para escritura (crear/actualizar)
    products = serializers.PrimaryKeyRelatedField(
        queryset=ProductUnidad.objects.all(),
        many=True,
        required=False,
        write_only=True
    )

    # Este se usa para lectura (mostrar los IDs asociados)
    product_ids = serializers.SerializerMethodField(read_only=True)

    usage_limit = serializers.IntegerField(
        required=False, allow_null=True, default=None,
        help_text="Número de veces que puede ser usado el descuento. Deja vacío para sin límite."
    )

    class Meta:
        model = Promotion
        fields = "__all__"
        # extra_fields = ['product_ids']

    def get_product_ids(self, obj):
        return list(obj.associated_products.values_list('id', flat=True))

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if isinstance(end_date, str) and end_date.strip() == "":
            data["end_date"] = None

        usage_limit = data.get("usage_limit")
        if isinstance(usage_limit, str) and usage_limit.strip() == "":
            data["usage_limit"] = None

        if start_date and data.get("end_date") and start_date == data["end_date"]:
            data["start_date"] = None
            data["end_date"] = None

        return data

    def create(self, validated_data):
        products = validated_data.pop("products", None)
        promotion = Promotion.objects.create(**validated_data)

        if products:
            promotion.associated_products.set(products)  # asignación directa
        return promotion

    def update(self, instance, validated_data):
        products = validated_data.pop("products", None)
        instance = super().update(instance, validated_data)

        if products is not None:
            instance.associated_products.set(products)  # actualizar relaciones
        return instance


class BanerInicioSerializer(serializers.ModelSerializer):
    imagen_banner_base64 = serializers.CharField(write_only=True, required=False)
    imagen_extra_base64 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = BanerInicio
        fields = ['id', 'encabezado', 'imagen_banner', 'imagen_extra', 'imagen_banner_base64', 'imagen_extra_base64']

    def create(self, validated_data):
        imagen_banner_base64 = validated_data.pop('imagen_banner_base64', None)
        imagen_extra_base64 = validated_data.pop('imagen_extra_base64', None)

        banner = BanerInicio(**validated_data)

        # Guardar imágenes en el servidor
        if imagen_banner_base64:
            banner.save_base64_image(imagen_banner_base64, 'imagen_banner')
        if imagen_extra_base64:
            banner.save_base64_image(imagen_extra_base64, 'imagen_extra')

        banner.save()
        return banner

    def update(self, instance, validated_data):
        imagen_banner_base64 = validated_data.pop('imagen_banner_base64', None)
        imagen_extra_base64 = validated_data.pop('imagen_extra_base64', None)

        # Actualizar solo los campos proporcionados en la solicitud
        instance.encabezado = validated_data.get('encabezado', instance.encabezado)

        # Guardar imágenes si se proporcionan en base64
        if imagen_banner_base64:
            instance.save_base64_image(imagen_banner_base64, 'imagen_banner')
        if imagen_extra_base64:
            instance.save_base64_image(imagen_extra_base64, 'imagen_extra')

        instance.save()
        return instance

class CarruselProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarruselProducto
        fields = '__all__'


# PARA MULTIPLES TALLAS
class ProductUnidadSerializer(serializers.ModelSerializer):
    imagenes = ImagenProductoSerializer(source='imagenproducto_set', many=True, read_only=True)
    imagenes_data = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    
    tallas = TallaStockSerializer(source="tallastock_set", many=True, required=False)
    colores = ProductColorStockSerializer(source="color_stock", many=True, required=False)  # ✅ Corregido para usar `color_stock`
    
    category = serializers.PrimaryKeyRelatedField(queryset=ProductCategory.objects.all())
    season = serializers.PrimaryKeyRelatedField(queryset=Season.objects.all())
    promotions = serializers.PrimaryKeyRelatedField(queryset=Promotion.objects.all(), many=True, required=False)

    class Meta:
        model = ProductUnidad
        fields = [
            'id', 'name', 'description', 'price', 'stock', 
            'tallas', 'colores',  
            'category', 'season', 'imagenes', 'imagenes_data', 'promotions'
        ]

    def create(self, validated_data):
        try:
            imagenes_data = validated_data.pop('imagenes_data', [])
            promotions = validated_data.pop('promotions', [])
            tallas_data = validated_data.pop('tallastock_set', [])  
            colores_data = validated_data.pop('color_stock', [])  # ✅ Ahora toma `color_stock` en lugar de `colores`

            producto = ProductUnidad.objects.create(**validated_data)

            # Asociar promociones
            producto.promotions.set(promotions)

            # Guardar tallas
            for talla_data in tallas_data:
                ProductTallaStock.objects.create(
                    product=producto, 
                    talla=talla_data.get('talla', None), 
                    stock=talla_data.get('stock', 0)
                )

            # Guardar colores
            for color_data in colores_data:
                ProductColorStock.objects.create(
                    product=producto,
                    color=color_data.get('color', ''), 
                    stock=color_data.get('stock', 0)
                )

            # Guardar imágenes
            for base64_string in imagenes_data:
                if base64_string.startswith("data:image"):
                    ImagenProducto.save_base64_image(base64_string, producto)

            return producto  

        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})  


class ProductUnidadUpdateSerializer(serializers.ModelSerializer):
    imagenes = ImagenProductoSerializer(source='imagenproducto_set', many=True, read_only=True)
    imagenes_data = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    tallas = TallaStockSerializer(source="tallastock_set", many=True, required=False)
    colores = ProductColorStockSerializer(source="productcolorstock_set", many=True, required=False)

    category = serializers.PrimaryKeyRelatedField(queryset=ProductCategory.objects.all())
    season = serializers.PrimaryKeyRelatedField(queryset=Season.objects.all())

    # Para lectura

    promotions = PromotionSerializer(many=True, read_only=True)
    # Para escritura
    promotions_ids = serializers.PrimaryKeyRelatedField(queryset=Promotion.objects.all(), many=True, write_only=True)

    class Meta:
        model = ProductUnidad
        fields = [
            'id', 'name', 'description', 'price', 'stock',
            'tallas', 'colores',  
            'category', 'season', 'imagenes', 'imagenes_data', 
            'promotions', 'promotions_ids'
        ]

    # def update(self, instance, validated_data):
    #     try:
    #         imagenes_data = validated_data.pop('imagenes_data', [])
    #         promotions_ids = [promo.id for promo in validated_data.pop('promotions_ids', [])]  # 🔥 Extrae IDs reales

    #         tallas_data = validated_data.pop('tallastock_set', [])  
    #         colores_data = validated_data.pop('productcolorstock_set', [])  

    #         # ✅ Actualizar los campos básicos del producto
    #         for attr, value in validated_data.items():
    #             setattr(instance, attr, value)
    #         instance.save()

    #         # ✅ **Actualizar promociones**
    #         if promotions_ids:
    #             promociones_objetos = list(Promotion.objects.filter(id__in=promotions_ids))  # ✅ Filtra por IDs reales
    #             instance.promotions.set(promociones_objetos)  # ✅ Asigna las promociones al producto
    #         else:
    #             instance.promotions.clear()  # 🔥 Si no hay promociones, se eliminan

    #         # ✅ **Actualizar tallas**
    #         for talla_data in tallas_data:
    #             talla_id = talla_data['talla'].id
    #             nuevo_stock = talla_data.get('stock', 0)

    #             talla_obj, created = ProductTallaStock.objects.get_or_create(
    #                 product=instance, talla_id=talla_id,
    #                 defaults={"stock": nuevo_stock}
    #             )

    #             if not created:
    #                 talla_obj.stock = nuevo_stock
    #                 talla_obj.save()

    #         # ✅ **Actualizar colores**
    #         for color_data in colores_data:
    #             color_value = color_data['color']
    #             nuevo_stock = color_data.get('stock', 0)

    #             color_obj, created = ProductColorStock.objects.get_or_create(
    #                 product=instance, color=color_value,
    #                 defaults={"stock": nuevo_stock}
    #             )

    #             if not created:
    #                 color_obj.stock = nuevo_stock
    #                 color_obj.save()

    #         # ✅ **Actualizar imágenes**
    #         for image_data in imagenes_data:
    #             image_id = image_data.get("id")
    #             image_src = image_data.get("src")

    #             if image_id is None and image_src.startswith("data:image"):  
    #                 nueva_imagen = ImagenProducto.save_base64_image(image_src, instance)

    #                 if nueva_imagen:
    #                     nueva_imagen.producto = instance
    #                     nueva_imagen.save()
    #                 else:
    #                     raise serializers.ValidationError({"error": "No se pudo guardar la imagen base64."})

    #         return instance  

    #     except Exception as e:
    #         raise serializers.ValidationError({"error": str(e)})

    def update(self, instance, validated_data):
        try:
            imagenes_data = validated_data.pop('imagenes_data', [])

            # 🔥 Obtener promotions_ids sin eliminarlo de validated_data
            promotions_data = validated_data.get('promotions_ids', [])
            promotions_ids = [int(promo) for promo in promotions_data if isinstance(promo, int)]

            tallas_data = validated_data.pop('tallastock_set', [])  
            colores_data = validated_data.pop('productcolorstock_set', [])  

            # ✅ Actualizar los campos básicos del producto
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # 📌 Verificar qué promociones llegan
            print(f"📌 Promotions enviados en el request: {promotions_ids}")

            # ✅ **Actualizar promociones solo si hay cambios**
            if promotions_ids:
                promociones_objetos = list(Promotion.objects.filter(id__in=promotions_ids))

                print(f"✅ Promociones encontradas en la BD: {promociones_objetos}")  

                if set(instance.promotions.all()) != set(promociones_objetos):  # 🔥 Verificar si hay cambios
                    instance.promotions.set(promociones_objetos)
                    instance.save()
                    print(f"🔄 Promotions después de actualizar: {list(instance.promotions.all())}")  
                else:
                    print("⚠️ Las promociones no han cambiado, no se actualiza.")
            else:
                print("⚠️ No se enviaron promociones. Se mantiene el estado actual.")

            # ✅ **Actualizar tallas**
            for talla_data in tallas_data:
                talla_id = talla_data['talla'].id
                nuevo_stock = talla_data.get('stock', 0)

                talla_obj, created = ProductTallaStock.objects.get_or_create(
                    product=instance, talla_id=talla_id,
                    defaults={"stock": nuevo_stock}
                )

                if not created:
                    talla_obj.stock = nuevo_stock
                    talla_obj.save()

            # ✅ **Actualizar colores**
            for color_data in colores_data:
                color_value = color_data['color']
                nuevo_stock = color_data.get('stock', 0)

                color_obj, created = ProductColorStock.objects.get_or_create(
                    product=instance, color=color_value,
                    defaults={"stock": nuevo_stock}
                )

                if not created:
                    color_obj.stock = nuevo_stock
                    color_obj.save()

            # ✅ **Actualizar imágenes**
            for image_data in imagenes_data:
                image_id = image_data.get("id")
                image_src = image_data.get("src")

                if image_id is None and image_src.startswith("data:image"):  
                    nueva_imagen = ImagenProducto.save_base64_image(image_src, instance)

                    if nueva_imagen:
                        nueva_imagen.producto = instance
                        nueva_imagen.save()
                    else:
                        raise serializers.ValidationError({"error": "No se pudo guardar la imagen base64."})

            return instance  

        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})

class ProductUnidadDetalleSerializer(serializers.ModelSerializer):
    imagenes = ImagenProductoSerializer(source='imagenproducto_set', many=True, read_only=True)
    imagenes_data = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    tallas = TallaStockSerializer(source="tallastock_set", many=True, required=False)
    colores = ProductColorStockSerializer(source="productcolorstock_set", many=True, required=False)  # Agregado aquí
    category = serializers.PrimaryKeyRelatedField(queryset=ProductCategory.objects.all())
    season = serializers.PrimaryKeyRelatedField(queryset=Season.objects.all())

    # Para lectura (mostrar detalles completos de promociones)
    promotions = PromotionSerializer(many=True, read_only=True)

    # Para escritura (aceptar solo IDs en la creación/actualización)
    promotions_ids = serializers.PrimaryKeyRelatedField(queryset=Promotion.objects.all(), many=True, write_only=True)

    class Meta:
        model = ProductUnidad
        fields = [
            'id', 'name', 'description', 'price', 'stock', 
            'tallas', 'colores', 'category', 'season', 
            'imagenes', 'imagenes_data', 'promotions', 'promotions_ids'
        ]

    def create(self, validated_data):
        imagenes_data = validated_data.pop('imagenes_data', [])
        promotions = validated_data.pop('promotions_ids', [])  
        tallas_data = validated_data.pop('tallastock_set', []) 
        colores_data = validated_data.pop('productcolorstock_set', [])  

        producto = ProductUnidad.objects.create(**validated_data)

        # Asociar promociones
        producto.promotions.set(promotions)

        # Guardar tallas y stock
        for talla_data in tallas_data:
            ProductTallaStock.objects.create(
                product=producto, 
                talla=talla_data['talla'], 
                stock=talla_data['stock']
            )

        # Guardar colores y stock
        for color_data in colores_data:
            ProductColorStock.objects.create(
                product=producto, 
                color=color_data['color'], 
                stock=color_data['stock']
            )

        # Guardar imágenes en Base64
        for base64_string in imagenes_data:
            if base64_string.startswith("data:image"):
                ImagenProducto.save_base64_image(base64_string, producto)

        return producto


class ProductCategorySerializer(serializers.ModelSerializer):
    products = ProductUnidadSerializer(many=True)

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'description', 'season', 'products']

# PARA SOLO MOSTRAR
class PromotionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = '__all__'  # Para incluir todos los campos del modelo

class TallasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Talla
        fields = '__all__'