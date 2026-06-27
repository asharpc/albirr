
import uuid
from datetime import datetime
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from rest_framework import permissions
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, EmailVerification
from api.v1.serializers.accounts import UserSerializer
from api.v1.serializers.accounts import (
    UserSerializer, LoginSerializer, EmailVerificationSerializer,
    ResendVerificationSerializer, UpdatePasswordSerializer
)
    

class AccountViewSet(viewsets.ViewSet):
    """
    ViewSet for handling user account-related actions: signup, login, email verification,
    resend verification, and password update.
    """
    
    def get_permissions(self):
        """Dynamically assign permissions based on action."""
        if self.action in ['signup', 'login', 'send_verification', 'resend_verification']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @swagger_auto_schema(
        operation_description="Register a new user and send email verification link.",
        request_body=UserSerializer,
        responses={
            201: openapi.Response(
                description="User created successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'email': openapi.Schema(type=openapi.TYPE_STRING),
                                'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'phone_number': openapi.Schema(type=openapi.TYPE_STRING)
                            }
                        )
                    }
                )
            ),
            400: openapi.Response(description="Invalid input data")
        }
    )
    @action(detail=False, methods=['post'], url_path='signup')
    def signup(self, request):
        """Handle user signup and initiate email verification."""
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                # Create email verification record
                verification = EmailVerification.objects.create(
                    email=user.email,
                    verification_sent=True,
                    is_verified=False
                )
                # Generate verification token (using UUID for simplicity)
                verification_token = str(uuid.uuid4())
                verification.verification_token = verification_token
                verification.save()
            # Send verification email (outside transaction)
            # verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
            # send_mail(
            #     subject='Verify Your Email',
            #     message=f'Click the link to verify your email: {verification_url}',
            #     from_email=settings.DEFAULT_FROM_EMAIL,
            #     recipient_list=[user.email],
            #     fail_silently=False,
            # )
            return Response({
                'message': 'User created successfully. Please verify your email.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Authenticate a user and return JWT tokens.",
        request_body=LoginSerializer,
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                        'access': openapi.Schema(type=openapi.TYPE_STRING),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'email': openapi.Schema(type=openapi.TYPE_STRING),
                                'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'phone_number': openapi.Schema(type=openapi.TYPE_STRING)
                            }
                        )
                    }
                )
            ),
            400: openapi.Response(description="Invalid input data"),
            401: openapi.Response(description="Invalid credentials"),
            403: openapi.Response(description="Email not verified")
        }
    )
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """Handle user login and return JWT tokens."""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(email=email, password=password)
            if user:
                # Check if email is verified
                verification = EmailVerification.objects.filter(email=email).first()
                if not verification or not verification.is_verified:
                    return Response({
                        'error': 'Email not verified. Please verify your email.'
                    }, status=status.HTTP_403_FORBIDDEN)
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Verify user email using the verification token.",
        request_body=EmailVerificationSerializer,
        responses={
            200: openapi.Response(
                description="Email verified successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: openapi.Response(description="Invalid or expired token")
        }
    )
    @action(detail=False, methods=['post'], url_path='send-verification')
    def send_verification(self, request):
        """Verify email using the verification token."""
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            verification = EmailVerification.objects.filter(
                verification_token=token,
                is_verified=False
            ).first()
            if verification:
                verification.is_verified = True
                verification.verified_at = datetime.now()
                verification.save()
                return Response({
                    'message': 'Email verified successfully.'
                }, status=status.HTTP_200_OK)
            return Response({
                'error': 'Invalid or expired verification token.'
            }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Resend email verification link to an unverified user.",
        request_body=ResendVerificationSerializer,
        responses={
            200: openapi.Response(
                description="Verification email resent",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: openapi.Response(description="Email is verified or not registered")
        }
    )
    @action(detail=False, methods=['post'], url_path='resend-verification')
    def resend_verification(self, request):
        """Resend verification email."""
        serializer = ResendVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            verification = EmailVerification.objects.filter(
                email=email,
                is_verified=False
            ).first()
            if not verification:
                return Response({
                    'error': 'Email is either verified or not registered.'
                }, status=status.HTTP_400_BAD_REQUEST)
            # Generate new verification token
            verification_token = str(uuid.uuid4())
            verification.verification_token = verification_token
            verification.verification_sent = True
            verification.verification_sent_at = datetime.now()
            verification.save()
            # Send verification email
            verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
            send_mail(
                subject='Verify Your Email',
                message=f'Click the link to verify your email: {verification_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({
                'message': 'Verification email resent successfully.'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Update the authenticated user's password.",
        request_body=UpdatePasswordSerializer,
        responses={
            200: openapi.Response(
                description="Password updated successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: openapi.Response(description="Invalid input data")
        }
    )
    @action(detail=False, methods=['post'], url_path='update-password')
    def update_password(self, request):
        """Update user password."""
        serializer = UpdatePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({
                'message': 'Password updated successfully.'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)