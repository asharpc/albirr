from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from api.v1.views.accounts import AccountViewSet
from api.v1.views.actors import (
    RoleViewSet, StudentViewSet, StaffViewSet, StandardViewSet,
    BatchViewSet, AmenityViewSet, StudentAmenityViewSet
)
from api.v1.views.finance import (
    ExpenseTypeViewSet, TransactionViewSet, StudentFeeViewSet,
    StaffSalaryViewSet, FeePaymentViewSet, SalaryPaymentViewSet
)


router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'roles', RoleViewSet)
router.register(r'student', StudentViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'standard', StandardViewSet)
router.register(r'batch', BatchViewSet)
router.register(r'amenities', AmenityViewSet)
router.register(r'student-amenities', StudentAmenityViewSet)

# Finance endpoints
router.register(r'expense-types', ExpenseTypeViewSet, basename='expensetype')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'student-fees', StudentFeeViewSet, basename='studentfee')
router.register(r'staff-salaries', StaffSalaryViewSet, basename='staffsalary')
router.register(r'fee-payments', FeePaymentViewSet, basename='feepayment')
router.register(r'salary-payments', SalaryPaymentViewSet, basename='salarypayment')

# Reports endpoint (using TransactionViewSet which has the comprehensive action)
router.register(r'reports', TransactionViewSet, basename='reports')

urlpatterns = router.urls + [
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
