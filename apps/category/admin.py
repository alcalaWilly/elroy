from django.contrib import admin
from .models import Season, ProductCategory

# Register your models here.

# Configuración para el modelo Season
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')  # Campos que se mostrarán en la lista
    list_display_links = ('id', 'name')  # Campos que serán enlaces
    search_fields = ('name',)  # Campos por los que se puede buscar
    list_per_page = 25  # Paginación

# Configuración para el modelo ProductCategory
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description', 'get_seasons')  # Campos que se mostrarán en la lista
    list_display_links = ('id', 'name')  # Campos que serán enlaces
    search_fields = ('name', 'description', 'seasons__name')  # Permite buscar también por temporadas
    list_filter = ('seasons',)  # Filtro lateral para temporadas
    list_per_page = 25  # Paginación
    filter_horizontal = ('seasons',)  # Widget para seleccionar temporadas

    # Método para mostrar las temporadas asociadas en la lista
    def get_seasons(self, obj):
        return ", ".join([season.name for season in obj.seasons.all()])
    get_seasons.short_description = 'Seasons'

# Registro de modelos en el panel de administración
admin.site.register(Season, SeasonAdmin)
admin.site.register(ProductCategory, ProductCategoryAdmin)