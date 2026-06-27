import getpass

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from tenants.models import Tenant


class Command(BaseCommand):
    help = "Create a tenant and its owning user in one shot."

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help="User email (login).")
        parser.add_argument('--password', help="User password. Prompted if omitted.")
        parser.add_argument('--first-name', required=True)
        parser.add_argument('--last-name', required=True)
        parser.add_argument('--phone', default='', help="Optional phone number.")
        parser.add_argument('--tenant-name', required=True, help="Tenant display name (must be unique).")
        parser.add_argument('--subdomain', default='', help="Optional. Auto-derived from --tenant-name when omitted.")
        parser.add_argument('--superuser', action='store_true', help="Mark the user as superuser + staff.")
        parser.add_argument(
            '--noinput', '--no-input', action='store_true', dest='noinput',
            help="Do not prompt for password — fail if --password is missing.",
        )

    def handle(self, *args, **opts):
        User = get_user_model()
        email = opts['email'].strip().lower()
        password = opts['password']
        first_name = opts['first_name']
        last_name = opts['last_name']
        phone = opts['phone']
        tenant_name = opts['tenant_name'].strip()
        subdomain = opts['subdomain'].strip()
        make_super = opts['superuser']
        noinput = opts['noinput']

        if User.objects.filter(email__iexact=email).exists():
            raise CommandError(f"User with email '{email}' already exists.")
        if Tenant.objects.filter(name=tenant_name).exists():
            raise CommandError(f"Tenant with name '{tenant_name}' already exists.")
        if subdomain and Tenant.objects.filter(subdomain=subdomain).exists():
            raise CommandError(f"Tenant with subdomain '{subdomain}' already exists.")

        if not password:
            if noinput:
                raise CommandError("--password is required when --noinput is set.")
            password = getpass.getpass("Password: ")
            confirm = getpass.getpass("Password (again): ")
            if password != confirm:
                raise CommandError("Passwords do not match.")
        if not password:
            raise CommandError("Password may not be empty.")

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone,
                )
                if make_super:
                    user.is_staff = True
                    user.is_superuser = True
                    user.save(update_fields=['is_staff', 'is_superuser'])

                tenant = Tenant(user=user, name=tenant_name)
                if subdomain:
                    tenant.subdomain = subdomain
                tenant.save()
        except ValidationError as e:
            raise CommandError(f"Validation error: {e.message_dict if hasattr(e, 'message_dict') else e}")

        self.stdout.write(self.style.SUCCESS(
            f"Created tenant '{tenant.name}' (subdomain='{tenant.subdomain}') "
            f"owned by user '{user.email}'."
        ))
