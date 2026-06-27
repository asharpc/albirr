from rest_framework import serializers
from finance.models import (
    ExpenseType, Transaction, StudentFee, StaffSalary, 
    FeePayment, SalaryPayment
)
from actors.models import Student, Staff
from tenants.models import Tenant
from api.v1.serializers.actors import StudentSerializer, StaffSerializer
from api.v1.serializers.actors import TenantSerializer


class ExpenseTypeSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    # tenant_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Tenant.objects.all(), source='tenant', write_only=True
    # )

    class Meta:
        model = ExpenseType
        fields = [
            'id', 'tenant',  'name', 'description', 
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    # tenant_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Tenant.objects.all(), source='tenant', write_only=True
    # )
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), source='student', write_only=True, 
        required=False, allow_null=True
    )
    staff = StaffSerializer(read_only=True)
    staff_id = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.all(), source='staff', write_only=True, 
        required=False, allow_null=True
    )
    expense_type = ExpenseTypeSerializer(read_only=True)
    expense_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ExpenseType.objects.all(), source='expense_type', write_only=True, 
        required=False, allow_null=True
    )
    
    # Read-only fields for display
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    related_entity = serializers.ReadOnlyField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'tenant',  'transaction_type', 'transaction_type_display',
            'category', 'category_display', 'amount', 'description', 'transaction_date',
            'student', 'student_id', 'staff', 'staff_id', 'expense_type', 'expense_type_id',
            'notes', 'created_by', 'related_entity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class StudentFeeSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    # tenant_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Tenant.objects.all(), source='tenant', write_only=True
    # )
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), source='student', write_only=True
    )
    
    # Read-only calculated fields
    fee_type_display = serializers.CharField(source='get_fee_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pending_amount = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = StudentFee
        fields = [
            'id', 'tenant', 'student', 'student_id', 'fee_type', 'fee_type_display',
            'total_amount', 'paid_amount', 'pending_amount', 'due_date', 'month_year',
            'status', 'status_display', 'is_overdue', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class StaffSalarySerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    # tenant_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Tenant.objects.all(), source='tenant', write_only=True
    # )
    staff = StaffSerializer(read_only=True)
    staff_id = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.all(), source='staff', write_only=True
    )
    
    # Read-only calculated fields
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    final_amount = serializers.ReadOnlyField()
    pending_amount = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = StaffSalary
        fields = [
            'id', 'tenant', 'staff', 'staff_id', 'base_amount',
            'deductions', 'bonuses', 'final_amount', 'paid_amount', 'pending_amount',
            'month_year', 'pay_date', 'status', 'status_display', 'is_overdue',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class FeePaymentSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    student_fee = StudentFeeSerializer(read_only=True)
    student_fee_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentFee.objects.all(), source='student_fee', write_only=True
    )
    transaction = TransactionSerializer(read_only=True)
    
    # Read-only display field
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = FeePayment
        fields = [
            'id', 'tenant', 'student_fee', 'student_fee_id', 'transaction',
            'amount', 'payment_method', 'payment_method_display', 'payment_date',
            'reference_number', 'reference_image', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['transaction', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Create associated transaction when creating a fee payment
        student_fee = validated_data['student_fee']
        
        # Create the transaction
        transaction_data = {
            'tenant': validated_data['tenant'],
            'transaction_type': 'INCOME',
            'category': 'TUITION_FEE',
            'amount': validated_data['amount'],
            'description': f"Fee payment for {student_fee.student.first_name} {student_fee.student.last_name}",
            'transaction_date': validated_data['payment_date'],
            'student': student_fee.student,
        }
        transaction = Transaction.objects.create(**transaction_data)
        
        # Create the fee payment
        validated_data['transaction'] = transaction
        fee_payment = FeePayment.objects.create(**validated_data)
        
        # Update the student fee's paid amount and status
        student_fee.paid_amount += validated_data['amount']
        student_fee.update_status()
        
        return fee_payment


class SalaryPaymentSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)

    staff_salary = StaffSalarySerializer(read_only=True)
    staff_salary_id = serializers.PrimaryKeyRelatedField(
        queryset=StaffSalary.objects.all(), source='staff_salary', write_only=True
    )
    transaction = TransactionSerializer(read_only=True)
    
    # Read-only display field
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = SalaryPayment
        fields = [
            'id', 'tenant', 'staff_salary', 'staff_salary_id', 'transaction',
            'amount', 'payment_method', 'payment_method_display', 'payment_date',
            'reference_number', 'reference_image', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['transaction', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Create associated transaction when creating a salary payment
        staff_salary = validated_data['staff_salary']
        
        # Create the transaction
        transaction_data = {
            'tenant': validated_data['tenant'],
            'transaction_type': 'EXPENSE',
            'category': 'STAFF_SALARY',
            'amount': validated_data['amount'],
            'description': f"Salary payment for {staff_salary.staff.first_name} {staff_salary.staff.last_name} - {staff_salary.month_year}",
            'transaction_date': validated_data['payment_date'],
            'staff': staff_salary.staff,
        }
        transaction = Transaction.objects.create(**transaction_data)
        
        # Create the salary payment
        validated_data['transaction'] = transaction
        salary_payment = SalaryPayment.objects.create(**validated_data)
        
        # Update the staff salary's paid amount and status
        staff_salary.paid_amount += validated_data['amount']
        staff_salary.update_status()
        
        return salary_payment


# Summary serializers for dashboard/reports
class FinanceSummarySerializer(serializers.Serializer):
    """Serializer for financial summary data"""
    total_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_fees = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_salaries = serializers.DecimalField(max_digits=15, decimal_places=2)
    students_with_pending_fees = serializers.IntegerField()
    staff_with_pending_salaries = serializers.IntegerField()


class MonthlyFinanceSummarySerializer(serializers.Serializer):
    """Serializer for monthly financial summary"""
    month_year = serializers.CharField()
    income = serializers.DecimalField(max_digits=15, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    transaction_count = serializers.IntegerField()


class DashboardStatsSerializer(serializers.Serializer):
    """Comprehensive dashboard statistics serializer"""
    # Basic counts
    total_students = serializers.IntegerField()
    total_staff = serializers.IntegerField()
    active_students = serializers.IntegerField()
    active_staff = serializers.IntegerField()
    
    # Financial overview
    current_month_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    current_month_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    current_month_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_pending_fees = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_pending_salaries = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Student statistics
    students_with_pending_fees = serializers.IntegerField()
    students_with_overdue_fees = serializers.IntegerField()
    total_fee_collections_today = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Staff statistics
    staff_with_pending_salaries = serializers.IntegerField()
    staff_with_overdue_salaries = serializers.IntegerField()
    staff_without_roles = serializers.IntegerField()
    total_salary_payments_today = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Recent activity
    recent_student_admissions = serializers.IntegerField()  # Last 30 days
    recent_staff_additions = serializers.IntegerField()  # Last 30 days
    recent_transactions_count = serializers.IntegerField()  # Last 7 days
    
    # Performance metrics
    fee_collection_rate = serializers.FloatField()  # Percentage
    salary_payment_rate = serializers.FloatField()  # Percentage
    average_fee_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_salary_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Monthly trends (last 6 months)
    monthly_income_trend = serializers.ListField(child=serializers.DecimalField(max_digits=15, decimal_places=2))
    monthly_expense_trend = serializers.ListField(child=serializers.DecimalField(max_digits=15, decimal_places=2))
    monthly_student_trend = serializers.ListField(child=serializers.IntegerField())
    monthly_staff_trend = serializers.ListField(child=serializers.IntegerField())
    
    # Alerts and notifications
    overdue_fees_alert = serializers.BooleanField()
    overdue_salaries_alert = serializers.BooleanField()
    low_collection_alert = serializers.BooleanField()
    
    # Additional insights
    top_fee_categories = serializers.ListField(child=serializers.DictField())
    top_expense_categories = serializers.ListField(child=serializers.DictField())
    payment_method_distribution = serializers.ListField(child=serializers.DictField())