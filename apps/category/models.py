from django.db import models
from django.core.files.base import ContentFile
import base64
import uuid



# Create your models here.
class Season(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Season"
        verbose_name_plural = "Seasons"

    def __str__(self):
        return self.name


class ProductCategory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    seasons = models.ManyToManyField(Season, related_name='categories')

    class Meta:
        verbose_name = "Product Category"
        verbose_name_plural = "Product Categories"

    def __str__(self):
        return self.name
    


class CategoryImage(models.Model):
    category = models.OneToOneField('ProductCategory', on_delete=models.CASCADE, related_name='image')
    image = models.ImageField(upload_to='category_images/', null=True, blank=True)
    caption = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Category Image"
        verbose_name_plural = "Category Images"

    def __str__(self):
        return f"Image for {self.category.name}"

    def save_base64_image(self, base64_data, field_name='image'):
        """
        Guarda una imagen codificada en base64 en el campo de imagen.
        """
        if base64_data:
            try:
                format, imgstr = base64_data.split(';base64,')
                ext = format.split('/')[-1]  # jpg, png, etc.
                file_name = f"{uuid.uuid4().hex}.{ext}"
                file_data = ContentFile(base64.b64decode(imgstr), name=file_name)
                setattr(self, field_name, file_data)
            except Exception as e:
                raise ValueError(f"Error al guardar la imagen base64: {e}")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)