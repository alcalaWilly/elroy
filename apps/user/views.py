from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
import requests
from django.shortcuts import render, redirect
from django.conf import settings
from django.contrib.auth import logout

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from django.contrib.sessions.models import Session
from rest_framework_simplejwt.tokens import OutstandingToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.http import HttpResponse
from .models import UserAccount
from .serializers import UserCreateSerializer
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.decorators import login_required
# Create your views here.


# def shop(request):
#     return render(request, 'shop.html', {'active_page': 'shop'})

def shop(request):
    category_id = request.GET.get('category')  # lee ?category=1 si existe
    context = {
        'active_page': 'shop',
        'category_id': category_id,  # lo puedes usar en tu template o JS
    }
    return render(request, 'shop.html', context)


# def login_social_oauth(request):
#     user = request.user
#     if not user.is_authenticated:
#         return JsonResponse({'error': 'No autenticado'}, status=401)

#     # 🔹 Generar tokens JWT
#     refresh = RefreshToken.for_user(user)
#     access_token = str(refresh.access_token)

#     response = JsonResponse({'message': 'Inicio de sesión exitoso'})

#     # 🔐 Configurar cookies seguras HTTPOnly
#     response.set_cookie(
#         key='access_token',
#         value=access_token,
#         httponly=True,  # Evita acceso con JavaScript (más seguro)
#         secure=True,  # Solo se envía en HTTPS
#         samesite='Lax',  # Protege contra ataques CSRF
#     )

#     response.set_cookie(
#         key='refresh_token',
#         value=str(refresh),
#         httponly=True,
#         secure=True,
#         samesite='Lax',
#     )

#     # Iniciar sesión en Django
#     login(request, user)

#     return response

# class LogoutView(APIView):
#     authentication_classes = [JWTAuthentication]  # ✅ Asegura que acepta JWT
#     permission_classes = [IsAuthenticated]  # ✅ Requiere autenticación

#     def post(self, request):
#         print("🔹 Headers:", request.headers)
#         print("🔹 Cookies:", request.COOKIES)  # 📌 Verifica si las cookies están llegando

#         logout(request)  

#         response = Response({"detail": "Logout successful."}, status=status.HTTP_204_NO_CONTENT)
#         response.delete_cookie("sessionid")
#         response.delete_cookie("csrftoken")
#         response.delete_cookie("access_token")
#         response.delete_cookie("refresh_token")

#         return response

# class LogoutView(APIView):
#     authentication_classes = [JWTAuthentication] 
#     permission_classes = [IsAuthenticated]  

#     def post(self, request):
#         user = request.user

#         print("🔹 Headers:", request.headers)
#         print("🔹 Cookies:", request.COOKIES)

#         # 🔹 Cerrar sesión en el dispositivo actual
#         logout(request)

#         # 🔹 Eliminar todas las sesiones del usuario en todos los dispositivos
#         Session.objects.filter(session_key=request.session.session_key).delete()

#         # 🔹 Crear respuesta y eliminar cookies
#         response = Response({"detail": "Logout successful."}, status=status.HTTP_204_NO_CONTENT)
#         response.delete_cookie("sessionid")
#         response.delete_cookie("csrftoken")
#         response.delete_cookie("access_token")
#         response.delete_cookie("refresh_token")

#         return response


# @csrf_exempt
# @never_cache
# class LogoutView(APIView):
#     authentication_classes = [JWTAuthentication] 
#     permission_classes = [IsAuthenticated]  

#     def post(self, request):
#         user = request.user
#         print("🔹 Headers:", request.headers)
#         print("🔹 Cookies antes de logout:", request.COOKIES)

#         # 🔹 Cerrar sesión en el dispositivo actual
#         logout(request)

#         # 🔹 Obtener el refresh_token del usuario si está almacenado en su perfil
#         refresh_token = getattr(user, "refresh_token", None)  # Ajusta si lo guardas en otro lado

#         if refresh_token:
#             # 🔹 Buscar y eliminar todas las sesiones con el mismo refresh_token
#             for session in Session.objects.all():
#                 data = session.get_decoded()
#                 if data.get('refresh_token') == refresh_token:
#                     session.delete()

#         # 🔹 Crear respuesta y eliminar TODAS las cookies excepto csrftoken
#         response = Response({"detail": "Logout successful from all devices."}, status=status.HTTP_204_NO_CONTENT)
#         response.delete_cookie("sessionid")
#         response.delete_cookie("access_token")
#         response.delete_cookie("refresh_token")

#         print("🔹 Cookies después de logout:", response.cookies)

#         return response




# @csrf_exempt
# @never_cache
# def logout_view(request):
#     if request.method == "POST":
#         user = request.user

#         # 🔹 Guardamos el estado autenticado antes de cerrar sesión
#         if user.is_authenticated:
#             # 🔹 Invalida TODOS los refresh tokens del usuario (cierra sesión en todos los dispositivos)
#             tokens = OutstandingToken.objects.filter(user=user)
#             for token in tokens:
#                 # Opcional: Lista negra del token antes de eliminarlo (si usas blacklist)
#                 BlacklistedToken.objects.get_or_create(token=token)
#                 token.delete()  # Elimina el token de la base de datos

#         # 🔹 Cerrar sesión
#         logout(request)

#         # 🔹 Crear respuesta JSON
#         response = JsonResponse({"message": "Sesión cerrada en todos los dispositivos"})

#         # 🔹 Eliminar cookies de autenticación
#         response.delete_cookie("sessionid")
#         response.delete_cookie("access_token")
#         response.delete_cookie("csrftoken")
#         response.delete_cookie("refresh_token")

#         # 🔹 Evitar caché
#         response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
#         response['Pragma'] = 'no-cache'
#         response['Expires'] = '0'

#         return response

#     return JsonResponse({"error": "Método no permitido"}, status=405)

def is_staff_or_superuser(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)

@csrf_exempt
@never_cache
@login_required(login_url='/login/')
def logout_view(request):
    # responder al pre-flight
    if request.method == "OPTIONS":
        resp = HttpResponse()
        resp["Allow"] = "POST, OPTIONS"
        return resp
    
    if request.method == "POST":
        user = request.user
        if user.is_authenticated:
            tokens = OutstandingToken.objects.filter(user=user)
            for t in tokens:
                BlacklistedToken.objects.get_or_create(token=t)
                t.delete()
        logout(request)
        response = redirect(settings.LOGOUT_REDIRECT_URL)    # redirige al “/”
        # limpia cookies igual que antes…
        for c in ("sessionid","access_token","csrftoken","refresh_token"):
            response.delete_cookie(c)
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return JsonResponse({"message": "Sesión cerrada con éxito"})
    return JsonResponse({"error":"Método no permitido"}, status=405)

class clientListView(APIView):
    
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated]  

    def get(self, request):
        try:
            users = UserAccount.objects.all()
            serializer = UserCreateSerializer(users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


