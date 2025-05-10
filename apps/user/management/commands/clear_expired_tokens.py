from django.core.management.base import BaseCommand
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from datetime import datetime

class Command(BaseCommand):
    help = "Eliminar tokens JWT expirados de la base de datos"

    def handle(self, *args, **kwargs):
        expired_tokens = OutstandingToken.objects.filter(expires_at__lt=datetime.utcnow())
        count = expired_tokens.count()
        expired_tokens.delete()
        self.stdout.write(self.style.SUCCESS(f"Se eliminaron {count} tokens expirados."))