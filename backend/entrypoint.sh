#!/bin/sh
set -e

if [ "${DB_ENGINE:-postgres}" != "sqlite" ]; then
  echo "Waiting for postgres at ${DB_HOST:-db}:${DB_PORT:-5432}..."
  python - <<'PY'
import os, socket, time, sys
host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', '5432'))
deadline = time.time() + 60
while time.time() < deadline:
    try:
        with socket.create_connection((host, port), timeout=2):
            sys.exit(0)
    except OSError:
        time.sleep(1)
print(f"Could not reach {host}:{port}", file=sys.stderr)
sys.exit(1)
PY
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput || true

if [ -n "${DJANGO_SUPERUSER_EMAIL:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  echo "Ensuring superuser ${DJANGO_SUPERUSER_EMAIL} exists..."
  python - <<'PY'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.contrib.auth import get_user_model

User = get_user_model()
email = os.environ['DJANGO_SUPERUSER_EMAIL']
password = os.environ['DJANGO_SUPERUSER_PASSWORD']
first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Admin')
last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'User')

user, created = User.objects.get_or_create(
    email=email,
    defaults={'first_name': first_name, 'last_name': last_name},
)
user.is_staff = True
user.is_superuser = True
user.first_name = first_name
user.last_name = last_name
user.set_password(password)
user.save()
print(f"Superuser {'created' if created else 'updated'}: {email}")
PY
fi

exec "$@"
