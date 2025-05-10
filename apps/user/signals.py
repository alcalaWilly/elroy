from django.dispatch import receiver
from django.db.models.signals import post_save
from django.shortcuts import render
from social_django.models import UserSocialAuth
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
User = get_user_model()

from django.http import JsonResponse

# @receiver(post_save, sender=UserSocialAuth)
# def auto_register_user(sender, instance, created, **kwargs):
#     """
#     Se ejecuta automáticamente cuando un usuario inicia sesión con Google o Facebook.
#     Asocia la cuenta social con un usuario existente, guarda la imagen de perfil y genera un token JWT.
#     """
#     if created:
#         user = instance.user
#         existing_user = User.objects.filter(email=user.email).first()

#         if existing_user:
#             instance.user = existing_user
#             instance.save()
#             print(f"Cuenta social asociada al usuario existente: {existing_user.email}")

#         # Verificar el proveedor (Google/Facebook)
#         if instance.provider == 'google-oauth2':  
#             print(f"{user.email} se registró usando Google.")

#             # Obtener la imagen del perfil desde Google
#             picture = instance.extra_data.get('picture')
#             if picture:
#                 user.profile_picture = picture  # Suponiendo que User tiene un campo profile_picture
#                 user.save()
#                 print(f"Imagen de perfil guardada para {user.email}: {picture}")

#         elif instance.provider == 'facebook':
#             print(f"{user.email} se registró usando Facebook.")

#         # 🔹 Generar Token JWT
#         refresh = RefreshToken.for_user(user)
#         access_token = str(refresh.access_token)

#         print(f"JWT generado para {user.email}:{access_token}")

#         # ✅ Devolver los tokens como JSON para que el frontend los reciba
#         return JsonResponse({
#             'access_token': access_token,
#             'refresh_token': str(refresh),
#             'email': user.email,
#             'picture_url': user.profile_picture if hasattr(user, 'profile_picture') else None
#         })










# @receiver(post_save, sender=UserSocialAuth)
# def auto_register_user(sender, instance, created, **kwargs):
#     """
#     Función que se ejecuta automáticamente cuando un usuario se registra o inicia sesión a través de Google.
#     Genera un token JWT y lo devuelve en la respuesta.
#     """
#     if created:
#         user = instance.user
#         existing_user = User.objects.filter(email=user.email).first()

#         if existing_user:
#             # Asociar la cuenta social con el usuario existente
#             instance.user = existing_user
#             instance.save()
#             print(f"Cuenta social asociada al usuario existente: {existing_user.email}")

#         if instance.provider == 'google':
#             print(f"{user.email} se registró usando Google.")
#         elif instance.provider == 'facebook':
#             print(f"{user.email} se registró usando Facebook.")

#         # Generar tokens JWT para el usuario
#         refresh = RefreshToken.for_user(user)
        
#         return JsonResponse({
#             'refresh': str(refresh),
#             'access': str(refresh.access_token),
#         })