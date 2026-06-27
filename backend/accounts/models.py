from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from core.models import BaseModel

from accounts.managers import UserManager

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    def __str__(self):
        return self.email
    

class EmailVerification(BaseModel):
    email = models.EmailField(null=True,blank=True)
    verification_sent = models.BooleanField(default=False)
    verification_sent_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True)
    verification_token = models.CharField(max_length=36, null=True, blank=True)

    def __str__(self):
        return self.email

