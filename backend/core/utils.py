import boto3
from django.conf import settings
from django.core.mail import send_mail
import uuid

def send_verification_email(user):
    sns_client = boto3.client(
        'sns',
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    
    verification_token = str(uuid.uuid4())
    verification_link = f"http://yourdomain.com/verify/{verification_token}"
    
    message = f"""
    Hello {user.first_name},
    
    Please verify your email by clicking the link below:
    {verification_link}
    
    Thank you!
    """
    
    try:
        sns_client.publish(
            TopicArn='your_sns_topic_arn',
            Message=message,
            Subject='Verify Your Email',
            MessageAttributes={
                'email': {
                    'DataType': 'String',
                    'StringValue': user.email
                }
            }
        )
        
        # Fallback to Django email
        send_mail(
            'Verify Your Email',
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending email: {str(e)}")