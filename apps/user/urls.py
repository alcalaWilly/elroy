from django.urls import path
from .views import shop, clientListView


urlpatterns = [
    path('shop/', shop,  name='shop'), 
    path('api/clientes/', clientListView.as_view(), name='user-list'),

]