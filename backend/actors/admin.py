from django.contrib import admin
from .models import Staff,Standard,Student,Role, Amenity, StudentAmenity
# Register your models here.
admin.site.register(Staff)
admin.site.register(Standard)
admin.site.register(Student)
admin.site.register(Role)
admin.site.register(Amenity)
admin.site.register(StudentAmenity)