from django.db import models
from apps.product.models import ProductUnidad
from django.conf import settings
User = settings.AUTH_USER_MODEL
from apps.product.models import Talla

# Create your models here.

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    total_items = models.IntegerField(default=0)


# class CartItem(models.Model):
#     cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
#     product = models.ForeignKey(ProductUnidad, on_delete=models.CASCADE)
#     count = models.IntegerField()


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product = models.ForeignKey(ProductUnidad, on_delete=models.CASCADE)
    count = models.IntegerField()
    color = models.CharField(max_length=50, null=True, blank=True)
    talla = models.PositiveIntegerField(verbose_name="numbertalla", null=True, blank=True)



