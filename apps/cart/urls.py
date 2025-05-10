from django.urls import path
from .views import (
    GetItemsView, AddItemView, GetTotalView, GetItemTotalView, 
    UpdateItemView, RemoveItemView, EmptyCartView, SynchCartView
)

urlpatterns = [
    path('cart-items', GetItemsView.as_view(), name='cart-items'),
    path('add-item', AddItemView.as_view(), name='add-item'),
    path('get-total', GetTotalView.as_view(), name='get-total'),
    path('get-item-total', GetItemTotalView.as_view(), name='get-item-total'),
    path('update-item', UpdateItemView.as_view(), name='update-item'),
    path('remove-item', RemoveItemView.as_view(), name='remove-item'),
    path('empty-cart', EmptyCartView.as_view(), name='empty-cart'),
    path('synch', SynchCartView.as_view(), name='synch-cart'),
]