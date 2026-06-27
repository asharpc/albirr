from django.contrib import admin

# Register your models here.

from tenants.models import Tenant, Theme

admin.site.register(Tenant)
admin.site.register(Theme)