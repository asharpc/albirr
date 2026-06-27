from django.db import models
from core.models import BaseModel
from tenants.models import Tenant
from decimal import Decimal

class Role(BaseModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
    

class Student(BaseModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='students')
    student_id = models.CharField(max_length=50)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    mothor_name = models.CharField(max_length=50)
    father_name = models.CharField(max_length=50)
    parent_phone_primary = models.CharField(max_length=15)
    parent_phone_secondary = models.CharField(max_length=15)
    address = models.CharField(max_length=250)
    email = models.EmailField()
    whatsapp_phone = models.CharField(max_length=15, blank=True)
    grade_level = models.CharField(max_length=10)
    joined_date = models.DateField()
    class Meta:
        unique_together = [('tenant', 'student_id'), ('tenant', 'email')]

    def save(self, *args, **kwargs):
        if not self.student_id:
            prefix = self.tenant.name.upper()[:5]
            last_student = Student.objects.filter(tenant=self.tenant).order_by('-student_id').first()
            num = int(last_student.student_id.split('-')[-1]) + 1 if last_student else 1
            self.student_id = f"{prefix}-{num:03d}"
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"

class Staff(BaseModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='staff')
    staff_id = models.CharField(max_length=50)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    hire_date = models.DateField()

    class Meta:
        unique_together = [('tenant', 'staff_id'), ('tenant', 'email')]

    def save(self, *args, **kwargs):
        if not self.staff_id:
            prefix = self.tenant.name.upper()[:5]
            last_staff = Staff.objects.filter(tenant=self.tenant).order_by('-staff_id').first()
            num = int(last_staff.staff_id.split('-')[-1]) + 1 if last_staff else 1
            self.staff_id = f"{prefix}-{num:03d}"
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.staff_id})"

class Standard(BaseModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='standard')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    # teacher = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    # students = models.ManyToManyField(Student, blank=True)
    # academic_year = models.CharField(max_length=9)  # e.g., "2024-2025"

    class Meta:
        unique_together = ('tenant', 'code')

    # def save(self, *args, **kwargs):
    #     if not self.code:
    #         prefix = self.tenant.name.upper()[:3]
    #         last_class = Class.objects.filter(tenant=self.tenant).order_by('-code').first()
    #         num = int(last_class.code.split('-')[-1]) + 1 if last_class else 1
    #         self.code = f"{prefix}-{num:03d}"
    #     self.full_clean()
    #     super().save(*args, **kwargs)

    # def __str__(self):
    #     return f"{self.name} ({self.code})"


class Batch(BaseModel):
    standard = models.ForeignKey(Standard, on_delete=models.CASCADE, related_name='batches')
    name = models.CharField(max_length=100)  # e.g., "Batch A", "2022 Batch"
    code = models.CharField(max_length=20,null=True)
    academic_year = models.CharField(max_length=9)  # e.g., "2022-2023"
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    students = models.ManyToManyField(Student, related_name='batches', blank=True)

    class Meta:
        db_table = 'batches'
        unique_together = ('standard', 'code')
        indexes = [
            models.Index(fields=['academic_year'], name='idx_batch_academic_year'),
            models.Index(fields=['start_date', 'end_date'], name='idx_batch_dates'),
        ]

    def __str__(self):
        return f"{self.name} ({self.academic_year})"

class Amenity(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='aminity')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    monthly_cost = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'amenities'
        indexes = [
            models.Index(fields=['name'], name='idx_amenity_name'),
        ]

    def __str__(self):
        return f"{self.name} - ₹{self.monthly_cost}"

class StudentAmenity(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # Null means ongoing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_amenities'
        unique_together = ('student', 'amenity', 'start_date')
        indexes = [
            models.Index(fields=['student', 'start_date', 'end_date'], name='idx_student_amenity_dates'),
            models.Index(fields=['amenity'], name='idx_student_amenity_amenity'),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.amenity.name}"

# class Fee(models.Model):
#     TRANSACTION_TYPES = (
#         ('INCOME', 'Income'),
#         ('EXPENSE', 'Expense'),
#     )
#     student = models.ForeignKey(Student, on_delete=models.CASCADE)
#     transaction_date = models.DateField()
#     category = models.CharField(max_length=50, default='Monthly Fee')
#     description = models.CharField(max_length=200)
#     amount = models.DecimalField(max_digits=10, decimal_places=2)  # Dynamically calculated
#     transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='INCOME')
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = 'fees'
#         indexes = [
#             models.Index(fields=['student'], name='idx_fee_student'),
#             models.Index(fields=['transaction_date'], name='idx_fee_transaction_date'),
#             models.Index(fields=['transaction_type', 'category'], name='idx_fee_type_category'),
#         ]

#     def __str__(self):
#         return f"{self.description} - ₹{self.amount}"

#     @staticmethod
#     def calculate_monthly_fee(student, transaction_date):
#         """Calculate total monthly fee based on active amenities and base fee."""
#         from django.db.models import Sum
#         # Check for active amenities on the transaction date
#         active_amenities = StudentAmenity.objects.filter(
#             student=student,
#             start_date__lte=transaction_date,
#             end_date__gte=transaction_date
#         ).aggregate(total_cost=Sum('amenity__monthly_cost'))
        
#         # Sum amenities cost (or 0 if none) and add student's base fee
#         amenities_cost = active_amenities['total_cost'] or Decimal('0.00')
#         total_fee = amenities_cost + student.base_monthly_fee
#         return total_fee

# class StaffSalary(models.Model):
#     TRANSACTION_TYPES = (
#         ('EXPENSE', 'Expense'),
#     )

#     staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
#     transaction_date = models.DateField()
#     category = models.CharField(max_length=50, default='Salary')
#     description = models.CharField(max_length=200)
#     amount = models.DecimalField(max_digits=10, decimal_places=2)  # Varies per staff
#     transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='EXPENSE')
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = 'staff_salaries'
#         indexes = [
#             models.Index(fields=['staff'], name='idx_salary_staff'),
#             models.Index(fields=['transaction_date'], name='idx_salary_transaction_date'),
#             models.Index(fields=['category'], name='idx_salary_category'),
#         ]

#     def __str__(self):
#         return f"{self.description} - ₹{self.amount}"