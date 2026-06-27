from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    ExpenseType, Transaction, StudentFee, StaffSalary, 
    FeePayment, SalaryPayment
)


@admin.register(ExpenseType)
class ExpenseTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'tenant', 'description_short', 'is_active', 
        'transaction_count', 'created_at'
    ]
    list_filter = ['is_active', 'tenant', 'created_at']
    search_fields = ['name', 'description', 'tenant__name']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['tenant', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'name', 'description', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def description_short(self, obj):
        """Show shortened description"""
        if obj.description:
            return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description
        return "-"
    description_short.short_description = "Description"
    
    def transaction_count(self, obj):
        """Count related transactions"""
        count = obj.transactions.count()
        if count > 0:
            url = reverse('admin:finance_transaction_changelist') + f'?expense_type__id__exact={obj.id}'
            return format_html('<a href="{}">{} transactions</a>', url, count)
        return "0 transactions"
    transaction_count.short_description = "Transactions"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'transaction_date', 'tenant', 'transaction_type_badge', 'category_badge',
        'amount_formatted', 'description_short', 'related_entity_link', 'created_at'
    ]
    list_filter = [
        'transaction_type', 'category', 'tenant', 'transaction_date',
        'created_at'
    ]
    search_fields = [
        'description', 'notes', 'student__first_name', 'student__last_name',
        'staff__first_name', 'staff__last_name', 'expense_type__name'
    ]
    readonly_fields = ['created_at', 'updated_at', 'related_entity']
    date_hierarchy = 'transaction_date'
    ordering = ['-transaction_date', '-created_at']
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('tenant', 'transaction_type', 'category', 'amount', 'description', 'transaction_date')
        }),
        ('Related Entities', {
            'fields': ('student', 'staff', 'expense_type'),
            'description': 'Link this transaction to a specific student, staff member, or expense type'
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Computed Fields', {
            'fields': ('related_entity',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def transaction_type_badge(self, obj):
        """Display transaction type with color coding"""
        if obj.transaction_type == 'INCOME':
            return format_html('<span style="color: green; font-weight: bold;">💰 {}</span>', 
                             obj.get_transaction_type_display())
        else:
            return format_html('<span style="color: red; font-weight: bold;">💸 {}</span>', 
                             obj.get_transaction_type_display())
    transaction_type_badge.short_description = "Type"
    
    def category_badge(self, obj):
        """Display category with appropriate styling"""
        category_icons = {
            'TUITION_FEE': '📚',
            'ADMISSION_FEE': '🎓',
            'AMENITY_FEE': '🏢',
            'OTHER_INCOME': '💰',
            'STAFF_SALARY': '👨‍💼',
            'OTHER_EXPENSE': '💸'
        }
        icon = category_icons.get(obj.category, '📋')
        return format_html('{} {}', icon, obj.get_category_display())
    category_badge.short_description = "Category"
    
    def amount_formatted(self, obj):
        """Format amount with currency and color"""
        color = "green" if obj.transaction_type == 'INCOME' else "red"
        return format_html('<span style="color: {}; font-weight: bold;">₹{:,.2f}</span>', 
                         color, obj.amount)
    amount_formatted.short_description = "Amount"
    
    def description_short(self, obj):
        """Show shortened description"""
        return obj.description[:40] + "..." if len(obj.description) > 40 else obj.description
    description_short.short_description = "Description"
    
    def related_entity_link(self, obj):
        """Create links to related entities"""
        entity = obj.related_entity
        if entity['type'] == 'student' and obj.student:
            url = reverse('admin:actors_student_change', args=[obj.student.id])
            return format_html('<a href="{}">👨‍🎓 {}</a>', url, entity['name'])
        elif entity['type'] == 'staff' and obj.staff:
            url = reverse('admin:actors_staff_change', args=[obj.staff.id])
            return format_html('<a href="{}">👨‍💼 {}</a>', url, entity['name'])
        elif entity['type'] == 'expense_type' and obj.expense_type:
            url = reverse('admin:finance_expensetype_change', args=[obj.expense_type.id])
            return format_html('<a href="{}">🏷️ {}</a>', url, entity['name'])
        return entity['name']
    related_entity_link.short_description = "Related To"


@admin.register(StudentFee)
class StudentFeeAdmin(admin.ModelAdmin):
    list_display = [
        'student_link', 'tenant', 'fee_type_badge', 'month_year',
        'total_amount_formatted', 'paid_amount_formatted', 'pending_amount_formatted',
        'status_badge', 'due_date', 'is_overdue_indicator'
    ]
    list_filter = [
        'fee_type', 'status', 'tenant', 'due_date', 'month_year', 'created_at'
    ]
    search_fields = [
        'student__first_name', 'student__last_name', 'student__student_id',
        'description', 'month_year'
    ]
    readonly_fields = ['pending_amount', 'is_overdue', 'created_at', 'updated_at']
    date_hierarchy = 'due_date'
    ordering = ['-due_date', 'student__first_name']
    actions = ['mark_as_paid', 'mark_as_overdue']
    
    fieldsets = (
        ('Student & Fee Information', {
            'fields': ('tenant', 'student', 'fee_type', 'description')
        }),
        ('Amount Details', {
            'fields': ('total_amount', 'paid_amount', 'pending_amount')
        }),
        ('Date Information', {
            'fields': ('due_date', 'month_year')
        }),
        ('Status', {
            'fields': ('status', 'is_overdue')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def student_link(self, obj):
        """Link to student admin page"""
        url = reverse('admin:actors_student_change', args=[obj.student.id])
        return format_html('<a href="{}">{} {} ({})</a>', 
                         url, obj.student.first_name, obj.student.last_name, obj.student.student_id)
    student_link.short_description = "Student"
    
    def fee_type_badge(self, obj):
        """Display fee type with icon"""
        icons = {
            'TUITION': '📚',
            'ADMISSION': '🎓',
            'AMENITY': '🏢',
            'OTHER': '📋'
        }
        return format_html('{} {}', icons.get(obj.fee_type, '📋'), obj.get_fee_type_display())
    fee_type_badge.short_description = "Fee Type"
    
    def total_amount_formatted(self, obj):
        return format_html('<span style="font-weight: bold;">₹{:,.2f}</span>', obj.total_amount)
    total_amount_formatted.short_description = "Total"
    
    def paid_amount_formatted(self, obj):
        color = "green" if obj.paid_amount > 0 else "gray"
        return format_html('<span style="color: {};">₹{:,.2f}</span>', color, obj.paid_amount)
    paid_amount_formatted.short_description = "Paid"
    
    def pending_amount_formatted(self, obj):
        color = "red" if obj.pending_amount > 0 else "green"
        return format_html('<span style="color: {}; font-weight: bold;">₹{:,.2f}</span>', 
                         color, obj.pending_amount)
    pending_amount_formatted.short_description = "Pending"
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'PARTIAL': 'blue',
            'PAID': 'green',
            'OVERDUE': 'red'
        }
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', 
                         colors.get(obj.status, 'black'), obj.get_status_display())
    status_badge.short_description = "Status"
    
    def is_overdue_indicator(self, obj):
        """Show overdue indicator"""
        if obj.is_overdue:
            return format_html('<span style="color: red;">⚠️ Overdue</span>')
        return format_html('<span style="color: green;">✅ On Time</span>')
    is_overdue_indicator.short_description = "Due Status"
    
    def mark_as_paid(self, request, queryset):
        """Mark selected fees as paid"""
        for fee in queryset:
            fee.paid_amount = fee.total_amount
            fee.update_status()
        self.message_user(request, f"Marked {queryset.count()} fees as paid.")
    mark_as_paid.short_description = "Mark selected fees as paid"
    
    def mark_as_overdue(self, request, queryset):
        """Mark selected fees as overdue"""
        queryset.update(status='OVERDUE')
        self.message_user(request, f"Marked {queryset.count()} fees as overdue.")
    mark_as_overdue.short_description = "Mark selected fees as overdue"


@admin.register(StaffSalary)
class StaffSalaryAdmin(admin.ModelAdmin):
    list_display = [
        'staff_link', 'tenant', 'month_year', 'base_amount_formatted',
        'deductions_formatted', 'bonuses_formatted', 'final_amount_formatted',
        'paid_amount_formatted', 'pending_amount_formatted', 'status_badge', 'pay_date'
    ]
    list_filter = ['status', 'tenant', 'month_year', 'pay_date', 'created_at']
    search_fields = [
        'staff__first_name', 'staff__last_name', 'staff__staff_id',
        'month_year', 'notes'
    ]
    readonly_fields = ['final_amount', 'pending_amount', 'is_overdue', 'created_at', 'updated_at']
    date_hierarchy = 'pay_date'
    ordering = ['-month_year', 'staff__first_name']
    actions = ['mark_as_paid', 'calculate_final_amounts']
    
    fieldsets = (
        ('Staff & Period Information', {
            'fields': ('tenant', 'staff', 'month_year', 'pay_date')
        }),
        ('Salary Components', {
            'fields': ('base_amount', 'deductions', 'bonuses', 'final_amount')
        }),
        ('Payment Status', {
            'fields': ('paid_amount', 'pending_amount', 'status', 'is_overdue')
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def staff_link(self, obj):
        """Link to staff admin page"""
        url = reverse('admin:actors_staff_change', args=[obj.staff.id])
        return format_html('<a href="{}">{} {} ({})</a>', 
                         url, obj.staff.first_name, obj.staff.last_name, obj.staff.staff_id)
    staff_link.short_description = "Staff"
    
    def base_amount_formatted(self, obj):
        return format_html('<span style="color: blue;">₹{:,.2f}</span>', obj.base_amount)
    base_amount_formatted.short_description = "Base Salary"
    
    def deductions_formatted(self, obj):
        color = "red" if obj.deductions > 0 else "gray"
        return format_html('<span style="color: {};">₹{:,.2f}</span>', color, obj.deductions)
    deductions_formatted.short_description = "Deductions"
    
    def bonuses_formatted(self, obj):
        color = "green" if obj.bonuses > 0 else "gray"
        return format_html('<span style="color: {};">₹{:,.2f}</span>', color, obj.bonuses)
    bonuses_formatted.short_description = "Bonuses"
    
    def final_amount_formatted(self, obj):
        return format_html('<span style="font-weight: bold; color: navy;">₹{:,.2f}</span>', obj.final_amount)
    final_amount_formatted.short_description = "Final Amount"
    
    def paid_amount_formatted(self, obj):
        color = "green" if obj.paid_amount > 0 else "gray"
        return format_html('<span style="color: {};">₹{:,.2f}</span>', color, obj.paid_amount)
    paid_amount_formatted.short_description = "Paid"
    
    def pending_amount_formatted(self, obj):
        color = "red" if obj.pending_amount > 0 else "green"
        return format_html('<span style="color: {}; font-weight: bold;">₹{:,.2f}</span>', 
                         color, obj.pending_amount)
    pending_amount_formatted.short_description = "Pending"
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'PARTIAL': 'blue',
            'PAID': 'green',
            'OVERDUE': 'red'
        }
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', 
                         colors.get(obj.status, 'black'), obj.get_status_display())
    status_badge.short_description = "Status"
    
    def mark_as_paid(self, request, queryset):
        """Mark selected salaries as paid"""
        for salary in queryset:
            salary.paid_amount = salary.final_amount
            salary.update_status()
        self.message_user(request, f"Marked {queryset.count()} salaries as paid.")
    mark_as_paid.short_description = "Mark selected salaries as paid"
    
    def calculate_final_amounts(self, request, queryset):
        """Recalculate final amounts for selected salaries"""
        for salary in queryset:
            salary.update_status()
        self.message_user(request, f"Recalculated final amounts for {queryset.count()} salaries.")
    calculate_final_amounts.short_description = "Recalculate final amounts"


@admin.register(FeePayment)
class FeePaymentAdmin(admin.ModelAdmin):
    list_display = [
        'payment_date', 'student_fee_link', 'amount_formatted', 
        'payment_method_badge', 'reference_number', 'transaction_link'
    ]
    list_filter = ['payment_method', 'payment_date', 'tenant', 'created_at']
    search_fields = [
        'student_fee__student__first_name', 'student_fee__student__last_name',
        'reference_number', 'notes'
    ]
    readonly_fields = ['transaction', 'created_at', 'updated_at']
    date_hierarchy = 'payment_date'
    ordering = ['-payment_date']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('tenant', 'student_fee', 'amount', 'payment_method', 'payment_date')
        }),
        ('Reference & Notes', {
            'fields': ('reference_number', 'notes')
        }),
        ('System Information', {
            'fields': ('transaction',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def student_fee_link(self, obj):
        """Link to student fee"""
        url = reverse('admin:finance_studentfee_change', args=[obj.student_fee.id])
        return format_html('<a href="{}">{} - {}</a>', 
                         url, f"{obj.student_fee.student.first_name} {obj.student_fee.student.last_name}", 
                         obj.student_fee.get_fee_type_display())
    student_fee_link.short_description = "Student Fee"
    
    def amount_formatted(self, obj):
        return format_html('<span style="color: green; font-weight: bold;">₹{:,.2f}</span>', obj.amount)
    amount_formatted.short_description = "Amount"
    
    def payment_method_badge(self, obj):
        """Display payment method with icon"""
        icons = {
            'CASH': '💵',
            'BANK_TRANSFER': '🏦',
            'CARD': '💳',
            'UPI': '📱',
            'CHEQUE': '📄',
            'OTHER': '💰'
        }
        return format_html('{} {}', icons.get(obj.payment_method, '💰'), 
                         obj.get_payment_method_display())
    payment_method_badge.short_description = "Payment Method"
    
    def transaction_link(self, obj):
        """Link to related transaction"""
        if obj.transaction:
            url = reverse('admin:finance_transaction_change', args=[obj.transaction.id])
            return format_html('<a href="{}">View Transaction</a>', url)
        return "-"
    transaction_link.short_description = "Transaction"


@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = [
        'payment_date', 'staff_salary_link', 'amount_formatted', 
        'payment_method_badge', 'reference_number', 'transaction_link'
    ]
    list_filter = ['payment_method', 'payment_date', 'tenant', 'created_at']
    search_fields = [
        'staff_salary__staff__first_name', 'staff_salary__staff__last_name',
        'reference_number', 'notes'
    ]
    readonly_fields = ['transaction', 'created_at', 'updated_at']
    date_hierarchy = 'payment_date'
    ordering = ['-payment_date']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('tenant', 'staff_salary', 'amount', 'payment_method', 'payment_date')
        }),
        ('Reference & Notes', {
            'fields': ('reference_number', 'notes')
        }),
        ('System Information', {
            'fields': ('transaction',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def staff_salary_link(self, obj):
        """Link to staff salary"""
        url = reverse('admin:finance_staffsalary_change', args=[obj.staff_salary.id])
        return format_html('<a href="{}">{} - {}</a>', 
                         url, f"{obj.staff_salary.staff.first_name} {obj.staff_salary.staff.last_name}", 
                         obj.staff_salary.month_year)
    staff_salary_link.short_description = "Staff Salary"
    
    def amount_formatted(self, obj):
        return format_html('<span style="color: red; font-weight: bold;">₹{:,.2f}</span>', obj.amount)
    amount_formatted.short_description = "Amount"
    
    def payment_method_badge(self, obj):
        """Display payment method with icon"""
        icons = {
            'BANK_TRANSFER': '🏦',
            'CASH': '💵',
            'CHEQUE': '📄',
            'OTHER': '💰'
        }
        return format_html('{} {}', icons.get(obj.payment_method, '💰'), 
                         obj.get_payment_method_display())
    payment_method_badge.short_description = "Payment Method"
    
    def transaction_link(self, obj):
        """Link to related transaction"""
        if obj.transaction:
            url = reverse('admin:finance_transaction_change', args=[obj.transaction.id])
            return format_html('<a href="{}">View Transaction</a>', url)
        return "-"
    transaction_link.short_description = "Transaction"


# Custom admin site configuration
admin.site.site_header = "Finance Management System"
admin.site.site_title = "Finance Admin"
admin.site.index_title = "Finance Administration"