from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from tenants.models import Tenant
from actors.models import Student, Staff


class ExpenseType(models.Model):
    """
    Manages different types of expenses that can be recorded under a tenant
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='expense_types')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['tenant', 'name']
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.name}"


class Transaction(models.Model):
    """
    Unified model for all financial transactions (income and expenses)
    """
    TRANSACTION_TYPES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    ]
    
    TRANSACTION_CATEGORIES = [
        # Income categories
        ('TUITION_FEE', 'Tuition Fee'),
        ('ADMISSION_FEE', 'Admission Fee'),
        ('AMENITY_FEE', 'Amenity Fee'),
        ('OTHER_INCOME', 'Other Income'),
        
        # Expense categories
        ('STAFF_SALARY', 'Staff Salary'),
        ('OTHER_EXPENSE', 'Other Expense'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=20, choices=TRANSACTION_CATEGORIES)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.CharField(max_length=255)
    transaction_date = models.DateField()
    
    # Optional relationships to specific entities
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='transactions'
    )
    staff = models.ForeignKey(
        Staff, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='transactions'
    )
    expense_type = models.ForeignKey(
        ExpenseType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    
    # Metadata
    notes = models.TextField(blank=True)
    created_by = models.CharField(max_length=100, blank=True)  # Could be FK to User later
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'transaction_type']),
            models.Index(fields=['tenant', 'transaction_date']),
            models.Index(fields=['tenant', 'category']),
            models.Index(fields=['student']),
            models.Index(fields=['staff']),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.get_transaction_type_display()} - {self.amount} on {self.transaction_date}"

    @property
    def related_entity(self):
        """Get the related entity (student, staff, or expense type)"""
        if self.student:
            return {'type': 'student', 'id': str(self.student.id), 'name': f"{self.student.first_name} {self.student.last_name}"}
        elif self.staff:
            return {'type': 'staff', 'id': str(self.staff.id), 'name': f"{self.staff.first_name} {self.staff.last_name}"}
        elif self.expense_type:
            return {'type': 'expense_type', 'id': str(self.expense_type.id), 'name': self.expense_type.name}
        return {'type': 'other', 'name': 'General'}


class StudentFee(models.Model):
    """
    Specific model for tracking student fees with payment status
    """
    FEE_TYPES = [
        ('TUITION', 'Tuition Fee'),
        ('ADMISSION', 'Admission Fee'),
        ('AMENITY', 'Amenity Fee'),
        ('OTHER', 'Other Fee'),
    ]
    
    FEE_STATUS = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='student_fees')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    fee_type = models.CharField(max_length=10, choices=FEE_TYPES)
    
    # Fee details
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    paid_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Date information
    due_date = models.DateField()
    month_year = models.CharField(max_length=7, blank=True)  # Format: "2024-01" for monthly fees
    
    # Status and metadata
    status = models.CharField(max_length=10, choices=FEE_STATUS, default='PENDING')
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']
        indexes = [
            models.Index(fields=['tenant', 'student']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'due_date']),
            models.Index(fields=['month_year']),
        ]

    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} - {self.get_fee_type_display()} - {self.total_amount}"

    @property
    def pending_amount(self):
        """Calculate remaining amount to be paid"""
        return self.total_amount - self.paid_amount

    @property
    def is_overdue(self):
        """Check if fee is overdue"""
        from django.utils import timezone
        return self.due_date < timezone.now().date() and self.status != 'PAID'

    def update_status(self):
        """Update fee status based on payment"""
        if self.paid_amount >= self.total_amount:
            self.status = 'PAID'
        elif self.paid_amount > 0:
            self.status = 'PARTIAL'
        elif self.is_overdue:
            self.status = 'OVERDUE'
        else:
            self.status = 'PENDING'
        self.save()


class StaffSalary(models.Model):
    """
    Specific model for tracking staff salaries with payment status
    """
    SALARY_STATUS = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='staff_salaries')
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='salaries')
    
    # Salary details
    base_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    deductions = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    bonuses = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    paid_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Date information
    month_year = models.CharField(max_length=7)  # Format: "2024-01"
    pay_date = models.DateField()
    
    # Status and metadata
    status = models.CharField(max_length=10, choices=SALARY_STATUS, default='PENDING')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['tenant', 'staff', 'month_year']
        ordering = ['-month_year', '-pay_date']
        indexes = [
            models.Index(fields=['tenant', 'staff']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'month_year']),
            models.Index(fields=['pay_date']),
        ]

    def __str__(self):
        return f"{self.staff.first_name} {self.staff.last_name} - {self.month_year} - {self.final_amount}"

    @property
    def final_amount(self):
        """Calculate final salary amount after deductions and bonuses"""
        return self.base_amount - self.deductions + self.bonuses

    @property
    def pending_amount(self):
        """Calculate remaining amount to be paid"""
        return self.final_amount - self.paid_amount

    @property
    def is_overdue(self):
        """Check if salary is overdue"""
        from django.utils import timezone
        return self.pay_date < timezone.now().date() and self.status != 'PAID'

    def update_status(self):
        """Update salary status based on payment"""
        final = self.final_amount
        if self.paid_amount >= final:
            self.status = 'PAID'
        elif self.paid_amount > 0:
            self.status = 'PARTIAL'
        elif self.is_overdue:
            self.status = 'OVERDUE'
        else:
            self.status = 'PENDING'
        self.save()


class FeePayment(models.Model):
    """
    Records individual payments made towards student fees
    """
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
        ('CHEQUE', 'Cheque'),
        ('OTHER', 'Other'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='fee_payments')
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='fee_payment')
    
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.CharField(max_length=15, choices=PAYMENT_METHODS)
    payment_date = models.DateField()
    reference_number = models.CharField(max_length=100, blank=True)
    reference_image = models.ImageField(upload_to='payment_references/fees/', blank=True, null=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['tenant', 'payment_date']),
            models.Index(fields=['student_fee']),
        ]

    def __str__(self):
        return f"Payment {self.amount} for {self.student_fee}"


class SalaryPayment(models.Model):
    """
    Records individual payments made towards staff salaries
    """
    PAYMENT_METHODS = [
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
        ('OTHER', 'Other'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='salary_payments')
    staff_salary = models.ForeignKey(StaffSalary, on_delete=models.CASCADE, related_name='payments')
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='salary_payment')
    
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.CharField(max_length=15, choices=PAYMENT_METHODS)
    payment_date = models.DateField()
    reference_number = models.CharField(max_length=100, blank=True)
    reference_image = models.ImageField(upload_to='payment_references/salaries/', blank=True, null=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['tenant', 'payment_date']),
            models.Index(fields=['staff_salary']),
        ]

    def __str__(self):
        return f"Salary payment {self.amount} for {self.staff_salary}"