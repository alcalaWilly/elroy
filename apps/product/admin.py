from django.contrib import admin
from apps.category.models import Season, ProductCategory
from .models import Talla, ProductUnidad, ImagenProducto, Promotion
from django.utils import timezone
from django import forms
from django.db import models

# Register your models here.
class TallaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cNombreTalla')  # Campos visibles
    list_display_links = ('id', 'cNombreTalla')  # Enlaces en la lista
    search_fields = ('cNombreTalla',)  # Búsqueda por nombre de talla
    list_per_page = 25  # Paginación


# Admin para ImagenProducto
class ImagenProductoAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'cRutaImagen', 'bEsActivo', 'dFechaCreacion')  # Campos visibles
    list_display_links = ('id', 'producto')  # Enlaces en la lista
    search_fields = ('producto__name', 'producto__category__name', 'producto__season__name')  # Búsqueda
    list_filter = ('bEsActivo', 'dFechaCreacion', 'producto__category', 'producto__season')  # Filtros laterales
    list_per_page = 25  # Paginación



class PromotionAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_percentage', 'active', 'start_date', 'end_date')
    list_filter = ('active', 'start_date', 'end_date')
    search_fields = ('name', 'code')
    filter_horizontal = ('products',)  # Permitir seleccionar productos

# Admin para ProductUnidad
# class ProductUnidadAdmin(admin.ModelAdmin):
#     list_display = (
#         'id', 'name', 'description', 'category', 'season',
#         'price', 'get_discounted_price', 'stock', 'talla'
#     )
#     list_filter = ('category', 'season', 'talla')  # Filtros en la barra lateral
#     search_fields = ('name', 'description')  # Búsqueda por nombre y descripción
#     ordering = ('-date_created',)  # Orden predeterminado

#     # Mostrar el precio con descuento
#     def get_discounted_price(self, obj):
#         discounted_price = obj.get_discounted_price()
#         return f"${discounted_price:.2f}" if discounted_price else "N/A"

#     get_discounted_price.short_description = "Precio con descuento"
#     get_discounted_price.admin_order_field = "price"

#     # Filtro dinámico para 'season' según 'category'
#     def formfield_for_foreignkey(self, db_field, request, **kwargs):
#         if db_field.name == "season" and 'category' in request.GET:
#             try:
#                 category_id = request.GET.get('category')
#                 kwargs["queryset"] = Season.objects.filter(categories__id=category_id)
#             except Season.DoesNotExist:
#                 kwargs["queryset"] = Season.objects.none()
#         return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
# admin.site.register(Talla, TallaAdmin)
# admin.site.register(ProductUnidad, ProductUnidadAdmin)
# admin.site.register(ImagenProducto, ImagenProductoAdmin)
# admin.site.register(Promotion, PromotionAdmin)

# Formulario personalizado para ProductUnidad
class ProductUnidadForm(forms.ModelForm):
    color = forms.CharField(
        widget=forms.TextInput(attrs={'type': 'color'}),
        required=False  # Permitir que el campo sea opcional
    )

    class Meta:
        model = ProductUnidad
        fields = '__all__'  # Incluir todos los campos sin afectar `name`

# class ProductUnidadAdmin(admin.ModelAdmin):
#     form = ProductUnidadForm  # Usar el formulario personalizado
#     list_display = (
#         'id', 'name', 'description', 'category', 'season',
#         'price', 'get_discounted_price', 'stock', 'talla', 'color_display'
#     )
#     list_filter = ('category', 'season', 'talla', 'color')  # Agregado color como filtro
#     search_fields = ('name', 'description', 'color')  # Permitir búsqueda por color
#     ordering = ('-date_created',)

#     # Mostrar color como cuadro en la lista de productos
#     def color_display(self, obj):
#         if obj.color:
#             return f'<div style="width: 25px; height: 25px; background-color: {obj.color}; border: 1px solid #000;"></div>'
#         return "Sin color"
    
#     color_display.allow_tags = True
#     color_display.short_description = "Vista previa del color"

#     # Mostrar el precio con descuento
#     def get_discounted_price(self, obj):
#         discounted_price = obj.get_discounted_price()
#         return f"${discounted_price:.2f}" if discounted_price else "N/A"

#     get_discounted_price.short_description = "Precio con descuento"
#     get_discounted_price.admin_order_field = "price"

#     # Filtro dinámico para 'season' según 'category'
#     def formfield_for_foreignkey(self, db_field, request, **kwargs):
#         if db_field.name == "season" and 'category' in request.GET:
#             try:
#                 category_id = request.GET.get('category')
#                 kwargs["queryset"] = Season.objects.filter(categories__id=category_id)
#             except Season.DoesNotExist:
#                 kwargs["queryset"] = Season.objects.none()
#         return super().formfield_for_foreignkey(db_field, request, **kwargs)


admin.site.register(Talla)
# admin.site.register(ProductUnidad, ProductUnidadAdmin)
admin.site.register(ImagenProducto)
admin.site.register(Promotion)