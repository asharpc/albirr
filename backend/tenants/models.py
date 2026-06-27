from django.db import models
from django.conf import settings
from core.models import BaseModel
from django.core.exceptions import ValidationError
import re

class Theme(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    template_path = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Tenant(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tenant')
    name = models.CharField(max_length=100, unique=True)
    subdomain = models.CharField(max_length=100, unique=True)
    theme = models.ForeignKey(Theme, on_delete=models.SET_NULL, null=True, blank=True)
    is_published = models.BooleanField(default=False)

    def clean(self):
        if not re.match(r'^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$', self.subdomain):
            raise ValidationError('Subdomain must be alphanumeric with hyphens, 1-63 characters.')

    def save(self, *args, **kwargs):
        if not self.subdomain:
            self.subdomain = self.name.lower().replace(' ', '-') + settings.DEFAULT_SUBDOMAIN_SUFFIX
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Domain(BaseModel):
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='custom_domain')
    domain_name = models.CharField(max_length=255, unique=True)
    is_verified = models.BooleanField(default=False)
    dns_records = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.domain_name

class Billing(BaseModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='billing')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    billing_cycle_start = models.DateField()
    billing_cycle_end = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"Billing for {self.tenant.name}"

class PaymentHistory(BaseModel):
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payment_history')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')

    def __str__(self):
        return f"Payment {self.transaction_id} for {self.tenant.name}"
    
