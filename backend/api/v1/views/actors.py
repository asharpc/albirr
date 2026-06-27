
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from core.pagination import StandardPageNumberPagination, SmallPageNumberPagination
from actors.models import Role, Student, Staff, Standard, Batch, Amenity, StudentAmenity
from api.v1.serializers.actors import (
    RoleSerializer, StudentSerializer, StaffSerializer, StandardSerializer,
    BatchSerializer, AmenitySerializer, StudentAmenitySerializer
)

class TenantFilteredViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        print('---14----')
        # Filter queryset by tenant based on authenticated user's tenant
        user = self.request.user
        if hasattr(user, 'tenant'):
            return self.queryset.filter(tenant=user.tenant)
        return self.queryset.none()
    
    def create(self, request, *args, **kwargs):
        tenant = request.user.tenant
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=tenant)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

class StudentViewSet(TenantFilteredViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['grade_level', ]
    search_fields = ['first_name', 'last_name', 'student_id', 'email']
    ordering_fields = ['first_name', 'last_name',  'created_at']
    

    # def get_queryset(self):
    #     # Filter queryset by tenant based on authenticated user's tenant
    #     print('---12----')
    #     user = self.request.user
    #     if hasattr(user, 'tenant'):
    #         return self.queryset.filter(tenant=user.tenant)
    #     return self.queryset.none()
    
    # def create(self, request, *args, **kwargs):
    #     tenant = request.user.tenant
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     serializer.save(tenant=tenant)
    #     headers = self.get_success_headers(serializer.data)
    #     return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    # def list(self, request, *args, **kwargs):
    #     queryset = self.filter_queryset(self.get_queryset())
    #     print('---create-list--')
    #     page = self.paginate_queryset(queryset)
    #     if page is not None:
    #         serializer = self.get_serializer(page, many=True)
    #         return self.get_paginated_response(serializer.data)

    #     serializer = self.get_serializer(queryset, many=True)
    #     return Response(serializer.data)
    
    # @action(detail=False, methods=['post'], url_path='create')
    # def create_student(self, request):
    #     print('---create-student-api-')
    #     tenant = request.user.tenant
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     serializer.save(tenant=tenant)
    #     headers = self.get_success_headers(serializer.data)
    #     return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    # @action(detail=False, methods=['get'], url_path='list')
    # def create_student(self, request):
    #     print('---create-student-api-')
    #     queryset = self.filter_queryset(self.get_queryset())
    #     print('---create-list--')
    #     page = self.paginate_queryset(queryset)
    #     if page is not None:
    #         serializer = self.get_serializer(page, many=True)
    #         return self.get_paginated_response(serializer.data)

    #     serializer = self.get_serializer(queryset, many=True)
    #     return Response(serializer.data)

class StaffViewSet(TenantFilteredViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPageNumberPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'hire_date']
    search_fields = ['first_name', 'last_name', 'staff_id', 'email']
    ordering_fields = ['first_name', 'last_name', 'hire_date', 'created_at']

class StandardViewSet(TenantFilteredViewSet):
    queryset = Standard.objects.all()
    serializer_class = StandardSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

class BatchViewSet(TenantFilteredViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['standard', 'academic_year', 'start_date']
    search_fields = ['name', 'code', 'academic_year']
    ordering_fields = ['name', 'start_date', 'created_at']

class AmenityViewSet(TenantFilteredViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'monthly_cost']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'monthly_cost', 'created_at']

class StudentAmenityViewSet(TenantFilteredViewSet):
    queryset = StudentAmenity.objects.all()
    serializer_class = StudentAmenitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'amenity', 'start_date']
    search_fields = ['student__first_name', 'student__last_name', 'amenity__name']
    ordering_fields = ['start_date', 'created_at']

