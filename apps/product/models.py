import base64
import uuid
from django.core.files.base import ContentFile
from django.core.exceptions import ObjectDoesNotExist


from django.db import models
from datetime import datetime
from django.utils import timezone
from django.utils.timezone import now
now = timezone.now()
from django.conf import settings
User = settings.AUTH_USER_MODEL


# Create your models here.
class Talla(models.Model):
    cNombreTalla = models.CharField(max_length=100)  # nvarchar(100)

    class Meta:
        db_table = 'Talla'  # Nombre de la tabla en la base de datos
        verbose_name = 'Talla'
        verbose_name_plural = 'Tallas'

    def __str__(self):
        return self.cNombreTalla

class Promotion(models.Model):
    name = models.CharField(max_length=255)  
    description = models.TextField(blank=True, null=True)  
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Descuento en porcentaje (Ej: 20 para 20%)"
    )
    code = models.CharField(
        max_length=50, blank=True, null=True, help_text="Código de descuento (opcional)"
    )
    start_date = models.DateTimeField(blank=True, null=True)  
    end_date = models.DateTimeField(blank=True, null=True)  
    active = models.BooleanField(default=False)
    money = models.BooleanField(default=False)
    usage_limit = models.PositiveIntegerField(
        blank=True, null=True, default=None, help_text="Número de veces que puede ser usado el descuento. Deja vacío para sin límite."
    )
    usage_count = models.PositiveIntegerField(default=0, help_text="Número de veces que se ha utilizado esta promoción.")

    class Meta:
        verbose_name = "Promoción"
        verbose_name_plural = "Promociones"

    def is_valid(self):
        now = timezone.now()
        if self.start_date and self.end_date:
            is_active = self.active and self.start_date <= now <= self.end_date
            if self.usage_limit is not None:
                is_active = is_active and self.usage_count < self.usage_limit
            return is_active
        return self.active

    def __str__(self):
        return f"{self.name} - {'Activo' if self.active else 'Inactivo'}"

class PromotionUsage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    promotion = models.ForeignKey('Promotion', on_delete=models.CASCADE)
    used_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Uso de promoción"
        verbose_name_plural = "Usos de promociones"

    def __str__(self):
        return f"{self.user.username} usó {self.promotion.code or self.promotion.name}"


class ProductUnidad(models.Model):
    name = models.CharField(max_length=255)  # Nombre del producto
    description = models.TextField(blank=True, null=True)  # Descripción opcional
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Precio"
    )
    stock = models.PositiveIntegerField(default=0, verbose_name="Stock disponible")
    category = models.ForeignKey(
        'category.ProductCategory',
        related_name="products",
        on_delete=models.CASCADE,
        verbose_name="Categoría"
    )
    season = models.ForeignKey(
        'category.Season',
        related_name="products",
        on_delete=models.CASCADE,
        verbose_name="Temporada"
    )

    date_created = models.DateTimeField(default=timezone.now, verbose_name="Fecha de creación")
    promotions = models.ManyToManyField(
        'Promotion',
        related_name='associated_products',  # Cambiado para evitar conflicto con el modelo `Promotion`
        verbose_name="Promociones asociadas",
        blank=True
    )

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def get_thumbnail(self):
        """
        Devuelve la URL de la miniatura del producto si está disponible.
        """
        if hasattr(self, 'photo') and self.photo:
            return self.photo.url
        return ''  # Retorna una cadena vacía si no hay miniatura

    def get_discounted_price(self):
        """
        Calcula y devuelve el precio con descuento basado en promociones activas.
        Si no hay promociones activas, devuelve el precio original.
        """
        active_promotions = self.promotions.filter(
            active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
        for promo in active_promotions:
            if promo.discount_percentage > 0:
                discount = self.price * (promo.discount_percentage / 100)
                return round(self.price - discount, 2)
        return self.price

    def __str__(self):
        return f"{self.name} - {self.category.name} ({self.season.name})"


class ProductTallaStock(models.Model):
    product = models.ForeignKey(ProductUnidad, on_delete=models.CASCADE, related_name="talla_stock")
    talla = models.ForeignKey(Talla, on_delete=models.CASCADE)
    stock = models.IntegerField()

    class Meta:
        unique_together = ('product', 'talla')  # Evita duplicados

class ProductColorStock(models.Model):
    product = models.ForeignKey(ProductUnidad, on_delete=models.CASCADE, related_name="color_stock")
    color = models.CharField(max_length=7)  # Guardará valores en formato RGB o HEX, ej. "#FF5733"
    stock = models.IntegerField()

    class Meta:
        unique_together = ('product', 'color')  # Evita que un mismo color se repita para un producto

    def __str__(self):
        return f"{self.product.name} - {self.color} ({self.stock} disponibles)"


class ImagenProducto(models.Model):
    producto = models.ForeignKey('ProductUnidad', on_delete=models.CASCADE)
    cRutaImagen = models.ImageField(upload_to='photos/%Y/%m/')
    bEsActivo = models.BooleanField(null=True, blank=True)
    dFechaCreacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ImagenesProductos'
        verbose_name = 'Imagen de Producto'
        verbose_name_plural = 'Imágenes de Productos'

    def __str__(self):
        return f"Imagen {self.id} - Producto {self.producto.name}"

    @staticmethod
    def save_base64_image(base64_string, product):
        """Decodifica una imagen en base64 y la guarda en el modelo."""
        try:
            format, imgstr = base64_string.split(';base64,')
            ext = format.split('/')[-1]  # Extraer la extensión de la imagen
            img_name = f"{uuid.uuid4()}.{ext}"  # Generar un nombre único
            data = ContentFile(base64.b64decode(imgstr), name=img_name)

            imagen = ImagenProducto(producto=product, cRutaImagen=data)
            imagen.save()
            return imagen
        except Exception as e:
            print("Error al guardar la imagen:", e)
            return None


class CarruselProducto(models.Model):
    producto = models.ForeignKey('ProductUnidad', on_delete=models.CASCADE)
    numTendencia = models.CharField(max_length=255)
    titleTendencia = models.CharField(max_length=255)

    def __str__(self):
        return f'{self.titleTendencia} ({self.numTendencia})'



def upload_to(instance, filename):
    return f'photos/{uuid.uuid4().hex}/{filename}'

class BanerInicio(models.Model):
    encabezado = models.CharField(max_length=255)  # Título del banner
    imagen_banner = models.ImageField(upload_to=upload_to, null=True, blank=True)  # Imagen almacenada en el servidor
    imagen_extra = models.ImageField(upload_to=upload_to, null=True, blank=True)   # Imagen adicional en el servidor

    def __str__(self):
        return self.encabezado

    def save_base64_image(self, base64_data, field_name):
        """
        Guarda una imagen codificada en base64 en el servidor.
        """
        if base64_data:
            format, imgstr = base64_data.split(';base64,')
            ext = format.split('/')[-1]  # Obtiene la extensión (jpg, png, etc.)
            file_name = f"{uuid.uuid4().hex}.{ext}"  # Nombre único
            file_data = ContentFile(base64.b64decode(imgstr), name=file_name)
            setattr(self, field_name, file_data)  # Asigna la imagen al campo del modelo

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    

