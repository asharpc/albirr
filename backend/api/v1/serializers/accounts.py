
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import User
# from core.utils import send_verification_email

# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['id', 'email', 'first_name', 'last_name', 'phone_number']
        
# class RegisterSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)
    
#     class Meta:
#         model = User
#         fields = ['email', 'password', 'first_name', 'last_name', 'phone_number']
        
#     def create(self, validated_data):
#         user = User.objects.create_user(**validated_data)
#         send_verification_email(user)
#         return user
    

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        """Create and return a new user."""
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    """Serializer for login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    token = serializers.CharField()

class ResendVerificationSerializer(serializers.Serializer):
    """Serializer for resending verification email."""
    email = serializers.EmailField()

class UpdatePasswordSerializer(serializers.Serializer):
    """Serializer for updating password."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value

    def validate_new_password(self, value):
        """Validate new password."""
        validate_password(value)
        return value