from rest_framework import status
from rest_framework.response import Response


class TenantFilterMixin:
    """
    Mixin to filter querysets by tenant and automatically set tenant on creation.
    """
    
    def get_tenant(self):
        """
        Get the tenant for the current user.
        """
        user = self.request.user
        if hasattr(user, 'tenant'):
            return user.tenant
        return None
    
    def get_queryset(self):
        """
        Filter queryset by tenant based on authenticated user's tenant.
        """
        tenant = self.get_tenant()
        if tenant:
            return super().get_queryset().filter(tenant=tenant)
        return super().get_queryset().none()
    
    def perform_create(self, serializer):
        """
        Automatically set the tenant when creating new objects.
        """
        tenant = self.get_tenant()
        if tenant:
            serializer.save(tenant=tenant)
        else:
            serializer.save()
    
    def create(self, request, *args, **kwargs):
        """
        Override create to handle tenant assignment.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)