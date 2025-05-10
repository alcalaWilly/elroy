from rest_framework import serializers
from .models import Season, ProductCategory, CategoryImage
from rest_framework import permissions
import os

class SeasonSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Season
        fields = '__all__'  # Para incluir todos los campos del modelo

class ProductCategorySerializer(serializers.ModelSerializer):
    seasons = SeasonSerializer(many=True)  # Mostrar detalles de las temporadas

    class Meta:
        model = ProductCategory
        fields = '__all__'


class ProductCategorySerializerAdd(serializers.ModelSerializer):
    seasons = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Season.objects.all()
    )  # Permite ingresar temporadas usando sus IDs

    class Meta:
        model = ProductCategory
        fields = '__all__'


class CategoryImageSerializer(serializers.ModelSerializer):
    base64_image = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CategoryImage
        fields = ['id', 'category', 'image', 'caption', 'base64_image']
        read_only_fields = ['id', 'image']

    def create(self, validated_data):
        base64_image = validated_data.pop('base64_image', None)
        instance = CategoryImage(**validated_data)

        if base64_image:
            instance.save_base64_image(base64_image)

        instance.save()
        return instance

    def update(self, instance, validated_data):
        base64_image = validated_data.pop('base64_image', None)
        category = validated_data.get('category')

        # Evitar cambiar a un category que ya esté en uso
        if category and category != instance.category:
            if CategoryImage.objects.filter(category=category).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError({"category": "Category Image with this category already exists."})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if base64_image:
            if instance.image and os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
            instance.save_base64_image(base64_image)

        instance.save()
        return instance



