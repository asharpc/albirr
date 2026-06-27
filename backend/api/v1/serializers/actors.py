from rest_framework import serializers
from actors.models import Role, Student, Staff, Standard, Batch, Amenity, StudentAmenity
from tenants.models import Tenant

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name']

class StudentSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    # tenant_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Tenant.objects.all(), source='tenant', write_only=True
    # )

    class Meta:
        model = Student
        fields = [
            'id', 'tenant', 'student_id', 'first_name', 'last_name',
            'mothor_name', 'father_name', 'parent_phone_primary', 'parent_phone_secondary',
            'address', 'email', 'whatsapp_phone', 'grade_level', 'joined_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['student_id', 'created_at', 'updated_at']

class StaffSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    # tenant_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Tenant.objects.all(), source='tenant', write_only=True
    # )
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='role', write_only=True, allow_null=True
    )

    class Meta:
        model = Staff
        fields = [
            'id', 'tenant', 'staff_id', 'first_name', 'last_name',
            'email', 'phone', 'role', 'role_id', 'hire_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['staff_id', 'created_at', 'updated_at']

class StandardSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    tenant_id = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(), source='tenant', write_only=True
    )

    class Meta:
        model = Standard
        fields = [
            'id', 'tenant', 'tenant_id', 'name', 'code', 'created_at', 'updated_at'
        ]
        read_only_fields = ['code', 'created_at', 'updated_at']

class BatchSerializer(serializers.ModelSerializer):
    standard = StandardSerializer(read_only=True)
    standard_id = serializers.PrimaryKeyRelatedField(
        queryset=Standard.objects.all(), source='standard', write_only=True
    )
    students = StudentSerializer(many=True, read_only=True)
    student_ids = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), source='students', many=True, write_only=True, required=False
    )

    class Meta:
        model = Batch
        fields = [
            'id', 'standard', 'standard_id', 'name', 'code', 'academic_year',
            'start_date', 'end_date', 'students', 'student_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = ['code', 'created_at', 'updated_at']

class AmenitySerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    tenant_id = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(), source='tenant', write_only=True
    )

    class Meta:
        model = Amenity
        fields = [
            'id', 'tenant', 'tenant_id', 'name', 'description', 'monthly_cost',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class StudentAmenitySerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), source='student', write_only=True
    )
    amenity = AmenitySerializer(read_only=True)
    amenity_id = serializers.PrimaryKeyRelatedField(
        queryset=Amenity.objects.all(), source='amenity', write_only=True
    )

    class Meta:
        model = StudentAmenity
        fields = [
            'id', 'student', 'student_id', 'amenity', 'amenity_id',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
