from djoser.serializers import UserCreateSerializer  as BaseUserCreateSerializer
from rest_framework import serializers
from .models import UserAccount
from django.contrib.auth import get_user_model
User = get_user_model()


# class UserCreateSerializer(BaseUserCreateSerializer):
#     # Campos adicionales que no están directamente en el modelo
#     full_name = serializers.SerializerMethodField()
#     short_name = serializers.SerializerMethodField()

#     class Meta(BaseUserCreateSerializer.Meta):
#         model = User
#         fields = (
#             'id',
#             'email',
#             'first_name',
#             'last_name',
#             'password',  # Campo de solo escritura
#             'full_name',
#             'short_name',
#         )
#         extra_kwargs = {
#             'password': {'write_only': True},  # Evita que se muestre la contraseña en las respuestas
#         }

#     def get_full_name(self, obj):
#         """Devuelve el nombre completo del usuario."""
#         return obj.get_full_name()

#     def get_short_name(self, obj):
#         """Devuelve el nombre corto del usuario."""
#         return obj.get_short_name()


class UserCreateSerializer(serializers.ModelSerializer):
    telefono = serializers.CharField(required=False, allow_blank=True, default=None)
    direccion = serializers.CharField(required=False, allow_blank=True, default=None)
    ruc = serializers.CharField(required=False, allow_blank=True, default=None)
    ciudad = serializers.CharField(required=False, allow_blank=True, default=None)
    region = serializers.CharField(required=False, allow_blank=True, default=None)
    codPostal = serializers.CharField(required=False, allow_blank=True, default=None)
    provider = serializers.CharField(required=False, allow_blank=True, default="manual")  # Para detectar Google

    class Meta:
        model = UserAccount
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 
                'telefono', 'direccion', 'ruc', 'ciudad', 'region', 'codPostal', 'provider')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        provider = validated_data.pop('provider', 'manual')

        if provider == 'google-oauth2':
            # Google no proporciona estos datos, aseguramos que sean None
            validated_data['telefono'] = None
            validated_data['direccion'] = None
            validated_data['ruc'] = None
            validated_data['ciudad'] = None
            validated_data['region'] = None
            validated_data['codPostal'] = None

        user = UserAccount.objects.create_user(**validated_data)
        return user


