from django.contrib import admin

# Register your models here.
from .models import User,EmailVerification

admin.site.register(User)
admin.site.register(EmailVerification)