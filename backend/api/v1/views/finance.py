from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from finance.models import (
    ExpenseType, Transaction, StudentFee, StaffSalary, 
    FeePayment, SalaryPayment
)
from api.v1.serializers.finance import (
    ExpenseTypeSerializer, TransactionSerializer, StudentFeeSerializer,
    StaffSalarySerializer, FeePaymentSerializer, SalaryPaymentSerializer,
    FinanceSummarySerializer, MonthlyFinanceSummarySerializer,
    DashboardStatsSerializer
)
from tenants.mixins import TenantFilterMixin
from core.pagination import StandardPageNumberPagination, LargePageNumberPagination, SmallPageNumberPagination

from api.v1.views.actors import TenantFilteredViewSet

class ExpenseTypeViewSet(TenantFilterMixin, TenantFilteredViewSet):
    """
    ViewSet for managing expense types
    """
    serializer_class = ExpenseTypeSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        return ExpenseType.objects.filter(tenant=self.get_tenant())


class TransactionViewSet(TenantFilterMixin, TenantFilteredViewSet):
    """
    ViewSet for managing all financial transactions
    """
    serializer_class = TransactionSerializer
    pagination_class = LargePageNumberPagination
    filterset_fields = ['transaction_type', 'category', 'student', 'staff', 'expense_type']
    search_fields = ['description', 'notes']
    ordering_fields = ['transaction_date', 'amount', 'created_at']
    ordering = ['-transaction_date', '-created_at']

    def get_queryset(self):
        return Transaction.objects.filter(tenant=self.get_tenant()).select_related(
            'tenant', 'student', 'staff', 'expense_type'
        )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get financial summary for the tenant"""
        tenant = self.get_tenant()
        
        # Current month's summary
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        transactions = Transaction.objects.filter(
            tenant=tenant,
            transaction_date__gte=current_month_start.date()
        )
        
        income = transactions.filter(transaction_type='INCOME').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        expenses = transactions.filter(transaction_type='EXPENSE').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        # Pending fees and salaries
        pending_fees = StudentFee.objects.filter(
            tenant=tenant, 
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).aggregate(
            total=Sum('total_amount') - Sum('paid_amount')
        )['total'] or Decimal('0.00')
        
        pending_salaries = StaffSalary.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).aggregate(
            total=Sum('base_amount') + Sum('bonuses') - Sum('deductions') - Sum('paid_amount')
        )['total'] or Decimal('0.00')
        
        students_with_pending = StudentFee.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).values('student').distinct().count()
        
        staff_with_pending = StaffSalary.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).values('staff').distinct().count()
        
        summary_data = {
            'total_income': income,
            'total_expenses': expenses,
            'net_balance': income - expenses,
            'pending_fees': pending_fees,
            'pending_salaries': pending_salaries,
            'students_with_pending_fees': students_with_pending,
            'staff_with_pending_salaries': staff_with_pending,
        }
        
        serializer = FinanceSummarySerializer(summary_data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly financial summary for the tenant"""
        tenant = self.get_tenant()
        months = int(request.query_params.get('months', 6))  # Default to last 6 months
        
        summaries = []
        now = timezone.now()
        
        for i in range(months):
            # Calculate month start and end
            month_date = now - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if month_start.month == 12:
                next_month = month_start.replace(year=month_start.year + 1, month=1)
            else:
                next_month = month_start.replace(month=month_start.month + 1)
            
            month_end = next_month - timedelta(days=1)
            
            transactions = Transaction.objects.filter(
                tenant=tenant,
                transaction_date__gte=month_start.date(),
                transaction_date__lte=month_end.date()
            )
            
            income = transactions.filter(transaction_type='INCOME').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            expenses = transactions.filter(transaction_type='EXPENSE').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            summaries.append({
                'month_year': month_start.strftime('%Y-%m'),
                'income': income,
                'expenses': expenses,
                'balance': income - expenses,
                'transaction_count': transactions.count()
            })
        
        serializer = MonthlyFinanceSummarySerializer(summaries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get comprehensive dashboard statistics for the tenant"""
        from actors.models import Student, Staff
        
        tenant = self.get_tenant()
        now = timezone.now()
        today = now.date()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Basic counts
        total_students = Student.objects.filter(tenant=tenant).count()
        total_staff = Staff.objects.filter(tenant=tenant).count()
        active_students = Student.objects.filter(tenant=tenant).count()  # Assume all are active for now
        active_staff = Staff.objects.filter(tenant=tenant).count()  # Assume all are active for now
        
        # Financial overview - Current month
        current_month_transactions = Transaction.objects.filter(
            tenant=tenant,
            transaction_date__gte=current_month_start.date()
        )
        
        current_month_income = current_month_transactions.filter(
            transaction_type='INCOME'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        current_month_expenses = current_month_transactions.filter(
            transaction_type='EXPENSE'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        current_month_balance = current_month_income - current_month_expenses
        
        # Pending amounts
        pending_fees = StudentFee.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).aggregate(
            total=Sum('total_amount') - Sum('paid_amount')
        )['total'] or Decimal('0.00')
        
        pending_salaries = StaffSalary.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).aggregate(
            total=Sum('base_amount') + Sum('bonuses') - Sum('deductions') - Sum('paid_amount')
        )['total'] or Decimal('0.00')
        
        # Student statistics
        students_with_pending_fees = StudentFee.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).values('student').distinct().count()
        
        students_with_overdue_fees = StudentFee.objects.filter(
            tenant=tenant,
            status='OVERDUE'
        ).values('student').distinct().count()
        
        # Today's fee collections
        total_fee_collections_today = FeePayment.objects.filter(
            tenant=tenant,
            payment_date=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Staff statistics
        staff_with_pending_salaries = StaffSalary.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).values('staff').distinct().count()
        
        staff_with_overdue_salaries = StaffSalary.objects.filter(
            tenant=tenant,
            status='OVERDUE'
        ).values('staff').distinct().count()
        
        staff_without_roles = Staff.objects.filter(
            tenant=tenant,
            role__isnull=True
        ).count()
        
        # Today's salary payments
        total_salary_payments_today = SalaryPayment.objects.filter(
            tenant=tenant,
            payment_date=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Recent activity (last 30 days)
        thirty_days_ago = (now - timedelta(days=30)).date()
        recent_student_admissions = Student.objects.filter(
            tenant=tenant,
            created_at__date__gte=thirty_days_ago
        ).count()
        
        recent_staff_additions = Staff.objects.filter(
            tenant=tenant,
            created_at__date__gte=thirty_days_ago
        ).count()
        
        # Recent transactions (last 7 days)
        seven_days_ago = (now - timedelta(days=7)).date()
        recent_transactions_count = Transaction.objects.filter(
            tenant=tenant,
            transaction_date__gte=seven_days_ago
        ).count()
        
        # Performance metrics
        total_fees = StudentFee.objects.filter(tenant=tenant).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('1.00')
        
        paid_fees = StudentFee.objects.filter(tenant=tenant).aggregate(
            total=Sum('paid_amount')
        )['total'] or Decimal('0.00')
        
        fee_collection_rate = float(paid_fees / total_fees * 100)
        
        total_salaries = StaffSalary.objects.filter(tenant=tenant).aggregate(
            total=Sum('base_amount') + Sum('bonuses') - Sum('deductions')
        )['total'] or Decimal('1.00')
        
        paid_salaries = StaffSalary.objects.filter(tenant=tenant).aggregate(
            total=Sum('paid_amount')
        )['total'] or Decimal('0.00')
        
        salary_payment_rate = float(paid_salaries / total_salaries * 100)
        
        # Average amounts
        average_fee_amount = StudentFee.objects.filter(tenant=tenant).aggregate(
            avg=Avg('total_amount')
        )['avg'] or Decimal('0.00')
        
        average_salary_amount = StaffSalary.objects.filter(tenant=tenant).aggregate(
            avg=Avg('base_amount')
        )['avg'] or Decimal('0.00')
        
        # Monthly trends (last 6 months)
        monthly_income_trend = []
        monthly_expense_trend = []
        monthly_student_trend = []
        monthly_staff_trend = []
        
        for i in range(6):
            month_date = now - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if month_start.month == 12:
                next_month = month_start.replace(year=month_start.year + 1, month=1)
            else:
                next_month = month_start.replace(month=month_start.month + 1)
            
            month_end = next_month - timedelta(days=1)
            
            # Monthly income/expense
            month_transactions = Transaction.objects.filter(
                tenant=tenant,
                transaction_date__gte=month_start.date(),
                transaction_date__lte=month_end.date()
            )
            
            month_income = month_transactions.filter(
                transaction_type='INCOME'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            month_expenses = month_transactions.filter(
                transaction_type='EXPENSE'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            monthly_income_trend.insert(0, month_income)
            monthly_expense_trend.insert(0, month_expenses)
            
            # Monthly student/staff additions
            month_students = Student.objects.filter(
                tenant=tenant,
                created_at__gte=month_start,
                created_at__lt=next_month
            ).count()
            
            month_staff = Staff.objects.filter(
                tenant=tenant,
                created_at__gte=month_start,
                created_at__lt=next_month
            ).count()
            
            monthly_student_trend.insert(0, month_students)
            monthly_staff_trend.insert(0, month_staff)
        
        # Alerts
        overdue_fees_alert = students_with_overdue_fees > 0
        overdue_salaries_alert = staff_with_overdue_salaries > 0
        low_collection_alert = fee_collection_rate < 80.0  # Alert if below 80%
        
        # Top categories
        top_fee_categories = list(StudentFee.objects.filter(tenant=tenant)
                                 .values('fee_type')
                                 .annotate(total=Sum('total_amount'), count=Count('id'))
                                 .order_by('-total')[:5])
        
        top_expense_categories = list(Transaction.objects.filter(
            tenant=tenant, transaction_type='EXPENSE'
        ).values('category').annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')[:5])
        
        # Payment method distribution
        payment_method_distribution = list(FeePayment.objects.filter(tenant=tenant)
                                          .values('payment_method')
                                          .annotate(total=Sum('amount'), count=Count('id'))
                                          .order_by('-total'))
        
        dashboard_data = {
            'total_students': total_students,
            'total_staff': total_staff,
            'active_students': active_students,
            'active_staff': active_staff,
            'current_month_income': current_month_income,
            'current_month_expenses': current_month_expenses,
            'current_month_balance': current_month_balance,
            'total_pending_fees': pending_fees,
            'total_pending_salaries': pending_salaries,
            'students_with_pending_fees': students_with_pending_fees,
            'students_with_overdue_fees': students_with_overdue_fees,
            'total_fee_collections_today': total_fee_collections_today,
            'staff_with_pending_salaries': staff_with_pending_salaries,
            'staff_with_overdue_salaries': staff_with_overdue_salaries,
            'staff_without_roles': staff_without_roles,
            'total_salary_payments_today': total_salary_payments_today,
            'recent_student_admissions': recent_student_admissions,
            'recent_staff_additions': recent_staff_additions,
            'recent_transactions_count': recent_transactions_count,
            'fee_collection_rate': fee_collection_rate,
            'salary_payment_rate': salary_payment_rate,
            'average_fee_amount': average_fee_amount,
            'average_salary_amount': average_salary_amount,
            'monthly_income_trend': monthly_income_trend,
            'monthly_expense_trend': monthly_expense_trend,
            'monthly_student_trend': monthly_student_trend,
            'monthly_staff_trend': monthly_staff_trend,
            'overdue_fees_alert': overdue_fees_alert,
            'overdue_salaries_alert': overdue_salaries_alert,
            'low_collection_alert': low_collection_alert,
            'top_fee_categories': top_fee_categories,
            'top_expense_categories': top_expense_categories,
            'payment_method_distribution': payment_method_distribution,
        }
        
        serializer = DashboardStatsSerializer(dashboard_data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def comprehensive(self, request):
        """Get comprehensive reports with filters for monthly/yearly periods"""
        from actors.models import Student, Staff
        
        tenant = self.get_tenant()
        
        # Get query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        filter_type = request.query_params.get('filter_type', 'monthly')
        
        if not start_date_str or not end_date_str:
            return Response(
                {'error': 'start_date and end_date parameters are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get transactions for the period
        transactions = Transaction.objects.filter(
            tenant=tenant,
            transaction_date__gte=start_date,
            transaction_date__lte=end_date
        ).select_related('student', 'staff', 'expense_type')
        
        # Financial summary
        income = transactions.filter(transaction_type='INCOME').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        expenses = transactions.filter(transaction_type='EXPENSE').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        financial_summary = {
            'total_income': income,
            'total_expenses': expenses,
            'net_balance': income - expenses,
            'transaction_count': transactions.count()
        }
        
        # Student fees for the period
        student_fees = StudentFee.objects.filter(
            tenant=tenant,
            due_date__gte=start_date,
            due_date__lte=end_date
        ).select_related('student')
        
        # Fee summary
        total_fees = student_fees.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        collected_fees = student_fees.aggregate(total=Sum('paid_amount'))['total'] or Decimal('0.00')
        pending_fees = total_fees - collected_fees
        
        students_count = student_fees.values('student').distinct().count()
        paid_students = student_fees.filter(status='PAID').values('student').distinct().count()
        pending_students = students_count - paid_students
        
        fee_summary = {
            'total_fees': total_fees,
            'collected_fees': collected_fees,
            'pending_fees': pending_fees,
            'students_count': students_count,
            'paid_students': paid_students,
            'pending_students': pending_students
        }
        
        # Staff salaries for the period
        staff_salaries = StaffSalary.objects.filter(
            tenant=tenant,
            pay_date__gte=start_date,
            pay_date__lte=end_date
        ).select_related('staff')
        
        # Salary summary
        total_salaries = staff_salaries.aggregate(
            total=Sum(models.F('base_amount') + models.F('bonuses') - models.F('deductions'))
        )['total'] or Decimal('0.00')
        paid_salaries = staff_salaries.aggregate(total=Sum('paid_amount'))['total'] or Decimal('0.00')
        pending_salaries = total_salaries - paid_salaries
        
        staff_count = staff_salaries.values('staff').distinct().count()
        paid_staff = staff_salaries.filter(status='PAID').values('staff').distinct().count()
        pending_staff = staff_count - paid_staff
        
        salary_summary = {
            'total_salaries': total_salaries,
            'paid_salaries': paid_salaries,
            'pending_salaries': pending_salaries,
            'staff_count': staff_count,
            'paid_staff': paid_staff,
            'pending_staff': pending_staff
        }
        
        # Monthly trends (for yearly reports or detailed monthly breakdown)
        monthly_trends = []
        if filter_type == 'yearly':
            # Generate monthly data for the year
            current_date = start_date
            while current_date <= end_date:
                month_start = current_date.replace(day=1)
                if month_start.month == 12:
                    month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
                
                month_transactions = transactions.filter(
                    transaction_date__gte=month_start,
                    transaction_date__lte=min(month_end, end_date)
                )
                
                month_income = month_transactions.filter(transaction_type='INCOME').aggregate(
                    total=Sum('amount')
                )['total'] or Decimal('0.00')
                
                month_expenses = month_transactions.filter(transaction_type='EXPENSE').aggregate(
                    total=Sum('amount')
                )['total'] or Decimal('0.00')
                
                monthly_trends.append({
                    'month': month_start.strftime('%Y-%m'),
                    'income': month_income,
                    'expenses': month_expenses,
                    'balance': month_income - month_expenses
                })
                
                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1, day=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1, day=1)
        
        # Category breakdown
        income_categories = transactions.filter(transaction_type='INCOME').values('category').annotate(
            amount=Sum('amount'), count=Count('id')
        ).order_by('-amount')
        
        expense_categories = transactions.filter(transaction_type='EXPENSE').values('category').annotate(
            amount=Sum('amount'), count=Count('id')
        ).order_by('-amount')
        
        category_breakdown = []
        for cat in income_categories:
            category_breakdown.append({
                'category': cat['category'],
                'amount': cat['amount'],
                'count': cat['count'],
                'type': 'income'
            })
        
        for cat in expense_categories:
            category_breakdown.append({
                'category': cat['category'],
                'amount': cat['amount'],
                'count': cat['count'],
                'type': 'expense'
            })
        
        # Serialize data
        transactions_serializer = TransactionSerializer(transactions, many=True)
        fees_serializer = StudentFeeSerializer(student_fees, many=True)
        salaries_serializer = StaffSalarySerializer(staff_salaries, many=True)
        
        report_data = {
            'financial_summary': financial_summary,
            'fee_summary': fee_summary,
            'salary_summary': salary_summary,
            'monthly_trends': monthly_trends,
            'category_breakdown': category_breakdown,
            'transactions': transactions_serializer.data,
            'student_fees': fees_serializer.data,
            'staff_salaries': salaries_serializer.data,
        }
        
        return Response(report_data)


class StudentFeeViewSet(TenantFilterMixin, TenantFilteredViewSet):
    """
    ViewSet for managing student fees
    """
    serializer_class = StudentFeeSerializer
    pagination_class = StandardPageNumberPagination
    filterset_fields = ['fee_type', 'status', 'student', 'month_year']
    search_fields = ['student__first_name', 'student__last_name', 'description']
    ordering_fields = ['due_date', 'total_amount', 'created_at']
    ordering = ['-due_date']

    def get_queryset(self):
        return StudentFee.objects.filter(tenant=self.get_tenant()).select_related(
            'tenant', 'student'
        )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending student fees"""
        queryset = self.get_queryset().filter(
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue student fees"""
        queryset = self.get_queryset().filter(
            Q(status='OVERDUE') | Q(due_date__lt=timezone.now().date(), status__in=['PENDING', 'PARTIAL'])
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant())

    def perform_update(self, serializer):
        instance = serializer.save()
        # Update status after any modification
        instance.update_status()


class StaffSalaryViewSet(TenantFilterMixin, TenantFilteredViewSet):
    """
    ViewSet for managing staff salaries
    """
    serializer_class = StaffSalarySerializer
    pagination_class = StandardPageNumberPagination
    filterset_fields = ['status', 'staff', 'month_year']
    search_fields = ['staff__first_name', 'staff__last_name', 'notes']
    ordering_fields = ['pay_date', 'base_amount', 'created_at']
    ordering = ['-month_year', '-pay_date']

    def get_queryset(self):
        return StaffSalary.objects.filter(tenant=self.get_tenant()).select_related(
            'tenant', 'staff'
        )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending staff salaries"""
        queryset = self.get_queryset().filter(
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue staff salaries"""
        queryset = self.get_queryset().filter(
            Q(status='OVERDUE') | Q(pay_date__lt=timezone.now().date(), status__in=['PENDING', 'PARTIAL'])
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant())

    def perform_update(self, serializer):
        instance = serializer.save()
        # Update status after any modification
        instance.update_status()


class FeePaymentViewSet(TenantFilterMixin, TenantFilteredViewSet):
    """
    ViewSet for managing fee payments
    """
    serializer_class = FeePaymentSerializer
    filterset_fields = ['payment_method', 'student_fee', 'payment_date']
    search_fields = ['student_fee__student__first_name', 'student_fee__student__last_name', 'reference_number']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']

    def get_queryset(self):
        return FeePayment.objects.filter(tenant=self.get_tenant()).select_related(
            'tenant', 'student_fee', 'student_fee__student', 'transaction'
        )

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant())


class SalaryPaymentViewSet(TenantFilterMixin, TenantFilteredViewSet):
    """
    ViewSet for managing salary payments
    """
    serializer_class = SalaryPaymentSerializer
    filterset_fields = ['payment_method', 'staff_salary', 'payment_date']
    search_fields = ['staff_salary__staff__first_name', 'staff_salary__staff__last_name', 'reference_number']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']

    def get_queryset(self):
        return SalaryPayment.objects.filter(tenant=self.get_tenant()).select_related(
            'tenant', 'staff_salary', 'staff_salary__staff', 'transaction'
        )

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant())