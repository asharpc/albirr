#!/usr/bin/env python3
"""
Production Deployment Script for Albirr School Management System
"""

import os
import subprocess
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('deployment.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DeploymentError(Exception):
    """Custom exception for deployment errors"""
    pass

class AlbirrDeployer:
    def __init__(self, project_root=None):
        self.project_root = Path(project_root) if project_root else Path(__file__).parent
        self.backend_dir = self.project_root / 'backend'
        self.frontend_dir = self.project_root / 'www'
        self.venv_dir = self.project_root / 'venv'
        
        # Production settings
        self.production_settings = {
            'DEBUG': False,
            'ALLOWED_HOSTS': ['*'],  # Configure with your domain
            'SECRET_KEY': 'CHANGE_THIS_IN_PRODUCTION',
            'DATABASE_URL': 'sqlite:///db_production.sqlite3',
            'STATIC_ROOT': str(self.project_root / 'staticfiles'),
            'MEDIA_ROOT': str(self.project_root / 'media'),
        }
        
    def run_command(self, command, cwd=None, check=True):
        """Execute shell command with logging"""
        logger.info(f"Running: {command}")
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                cwd=cwd or self.project_root,
                check=check,
                capture_output=True,
                text=True
            )
            if result.stdout:
                logger.info(result.stdout)
            return result
        except subprocess.CalledProcessError as e:
            logger.error(f"Command failed: {e}")
            if e.stderr:
                logger.error(e.stderr)
            raise DeploymentError(f"Command failed: {command}")
    
    def check_prerequisites(self):
        """Check if all required tools are available"""
        logger.info("Checking prerequisites...")
        
        # Check Python
        try:
            result = subprocess.run([sys.executable, '--version'], capture_output=True, text=True)
            logger.info(f"Python version: {result.stdout.strip()}")
        except Exception as e:
            raise DeploymentError(f"Python not found: {e}")
        
        # Check Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            logger.info(f"Node.js version: {result.stdout.strip()}")
        except Exception as e:
            raise DeploymentError(f"Node.js not found. Please install Node.js: {e}")
        
        # Check npm
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
            logger.info(f"npm version: {result.stdout.strip()}")
        except Exception as e:
            raise DeploymentError(f"npm not found: {e}")
        
        logger.info("Prerequisites check completed successfully")
    
    def setup_python_environment(self):
        """Setup Python virtual environment and install dependencies"""
        logger.info("Setting up Python environment...")
        
        # Create virtual environment if it doesn't exist
        if not self.venv_dir.exists():
            self.run_command(f"{sys.executable} -m venv {self.venv_dir}")
        
        # Determine pip path
        if os.name == 'nt':  # Windows
            pip_path = self.venv_dir / 'Scripts' / 'pip'
            python_path = self.venv_dir / 'Scripts' / 'python'
        else:  # Unix/Linux/macOS
            pip_path = self.venv_dir / 'bin' / 'pip'
            python_path = self.venv_dir / 'bin' / 'python'
        
        # Install backend dependencies
        requirements_file = self.backend_dir / 'requirements.txt'
        if requirements_file.exists():
            self.run_command(f"{pip_path} install -r {requirements_file}")
        else:
            raise DeploymentError("requirements.txt not found in backend directory")
        
        # Install production dependencies
        self.run_command(f"{pip_path} install gunicorn whitenoise psycopg2-binary")
        
        logger.info("Python environment setup completed")
        return python_path, pip_path
    
    def create_production_settings(self):
        """Create production settings file"""
        logger.info("Creating production settings...")
        
        settings_file = self.backend_dir / 'config' / 'settings_production.py'
        
        settings_content = f'''
# Production settings for Albirr School Management System
import os
from .settings import *

# Security settings
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', '{self.production_settings["SECRET_KEY"]}')
ALLOWED_HOSTS = ['*']  # Configure with your actual domain

# Database
DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_production.sqlite3',
    }}
}}

# Static files
STATIC_ROOT = os.path.join(BASE_DIR.parent, 'staticfiles')
STATIC_URL = '/static/'

# Media files
MEDIA_ROOT = os.path.join(BASE_DIR.parent, 'media')
MEDIA_URL = '/media/'

# Security enhancements
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",  # Replace with your actual domain
    "http://localhost:3000",   # For local testing
]

# Logging
LOGGING = {{
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {{
        'file': {{
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR.parent, 'django.log'),
        }},
    }},
    'loggers': {{
        'django': {{
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        }},
    }},
}}
'''
        
        with open(settings_file, 'w') as f:
            f.write(settings_content)
        
        logger.info(f"Production settings created at {settings_file}")
    
    def build_frontend(self):
        """Build the React frontend for production"""
        logger.info("Building frontend...")
        
        if not self.frontend_dir.exists():
            raise DeploymentError("Frontend directory not found")
        
        # Install frontend dependencies
        self.run_command('npm install', cwd=self.frontend_dir)
        
        # Build for production
        self.run_command('npm run build', cwd=self.frontend_dir)
        
        # Verify build output
        dist_dir = self.frontend_dir / 'dist'
        if not dist_dir.exists():
            raise DeploymentError("Frontend build failed - dist directory not found")
        
        logger.info("Frontend build completed successfully")
    
    def setup_backend(self, python_path):
        """Setup Django backend for production"""
        logger.info("Setting up Django backend...")
        
        # Set Django settings module for production
        os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings_production'
        
        # Run Django management commands
        manage_py = self.backend_dir / 'manage.py'
        
        # Collect static files
        self.run_command(f"{python_path} {manage_py} collectstatic --noinput", cwd=self.backend_dir)
        
        # Run migrations
        self.run_command(f"{python_path} {manage_py} migrate", cwd=self.backend_dir)
        
        # Create superuser (optional, with environment variables)
        if os.environ.get('DJANGO_SUPERUSER_USERNAME'):
            try:
                self.run_command(
                    f"{python_path} {manage_py} createsuperuser --noinput",
                    cwd=self.backend_dir,
                    check=False
                )
            except:
                logger.warning("Superuser creation skipped (may already exist)")
        
        logger.info("Django backend setup completed")
    
    def create_startup_scripts(self, python_path):
        """Create startup scripts for production"""
        logger.info("Creating startup scripts...")
        
        # Create gunicorn start script
        gunicorn_script = self.project_root / 'start_gunicorn.sh'
        gunicorn_content = f'''#!/bin/bash
cd {self.backend_dir}
export DJANGO_SETTINGS_MODULE=config.settings_production
{python_path} -m gunicorn config.wsgi:application \\
    --bind 0.0.0.0:8000 \\
    --workers 3 \\
    --worker-class gevent \\
    --worker-connections 1000 \\
    --max-requests 1000 \\
    --max-requests-jitter 100 \\
    --timeout 30 \\
    --keep-alive 2 \\
    --log-level info \\
    --access-logfile ../logs/gunicorn-access.log \\
    --error-logfile ../logs/gunicorn-error.log
'''
        
        with open(gunicorn_script, 'w') as f:
            f.write(gunicorn_content)
        
        # Make executable
        os.chmod(gunicorn_script, 0o755)
        
        # Create nginx configuration template
        nginx_config = self.project_root / 'nginx_albirr.conf'
        nginx_content = f'''
server {{
    listen 80;
    server_name your-domain.com;  # Replace with your actual domain
    
    # Serve static files
    location /static/ {{
        alias {self.project_root}/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }}
    
    # Serve media files
    location /media/ {{
        alias {self.project_root}/media/;
        expires 30d;
    }}
    
    # API requests
    location /api/ {{
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
    
    # Admin panel
    location /admin/ {{
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
    
    # Serve React frontend
    location / {{
        root {self.frontend_dir}/dist;
        try_files $uri $uri/ /index.html;
    }}
}}
'''
        
        with open(nginx_config, 'w') as f:
            f.write(nginx_content)
        
        logger.info("Startup scripts created successfully")
    
    def create_systemd_service(self, python_path):
        """Create systemd service file"""
        logger.info("Creating systemd service...")
        
        service_content = f'''[Unit]
Description=Albirr School Management System
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory={self.backend_dir}
Environment=DJANGO_SETTINGS_MODULE=config.settings_production
ExecStart={python_path} -m gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
'''
        
        service_file = self.project_root / 'albirr.service'
        with open(service_file, 'w') as f:
            f.write(service_content)
        
        logger.info(f"Systemd service file created at {service_file}")
        logger.info("To install: sudo cp albirr.service /etc/systemd/system/")
        logger.info("To enable: sudo systemctl enable albirr")
        logger.info("To start: sudo systemctl start albirr")
    
    def create_directories(self):
        """Create necessary directories"""
        logger.info("Creating necessary directories...")
        
        directories = [
            self.project_root / 'logs',
            self.project_root / 'staticfiles',
            self.project_root / 'media',
        ]
        
        for directory in directories:
            directory.mkdir(exist_ok=True)
            logger.info(f"Created directory: {directory}")
    
    def deploy(self):
        """Main deployment function"""
        try:
            logger.info("Starting Albirr School Management System deployment...")
            logger.info(f"Project root: {self.project_root}")
            
            # Check prerequisites
            self.check_prerequisites()
            
            # Create necessary directories
            self.create_directories()
            
            # Setup Python environment
            python_path, pip_path = self.setup_python_environment()
            
            # Create production settings
            self.create_production_settings()
            
            # Build frontend
            self.build_frontend()
            
            # Setup backend
            self.setup_backend(python_path)
            
            # Create startup scripts
            self.create_startup_scripts(python_path)
            
            # Create systemd service
            self.create_systemd_service(python_path)
            
            logger.info("="*60)
            logger.info("DEPLOYMENT COMPLETED SUCCESSFULLY!")
            logger.info("="*60)
            logger.info("")
            logger.info("Next steps:")
            logger.info("1. Configure your domain in nginx_albirr.conf")
            logger.info("2. Install nginx and copy the configuration:")
            logger.info("   sudo cp nginx_albirr.conf /etc/nginx/sites-available/albirr")
            logger.info("   sudo ln -s /etc/nginx/sites-available/albirr /etc/nginx/sites-enabled/")
            logger.info("3. Install and start the systemd service:")
            logger.info("   sudo cp albirr.service /etc/systemd/system/")
            logger.info("   sudo systemctl enable albirr")
            logger.info("   sudo systemctl start albirr")
            logger.info("4. Restart nginx: sudo systemctl restart nginx")
            logger.info("5. Set environment variables for production:")
            logger.info("   export SECRET_KEY='your-secret-key-here'")
            logger.info("   export DJANGO_SUPERUSER_USERNAME='admin'")
            logger.info("   export DJANGO_SUPERUSER_EMAIL='admin@example.com'")
            logger.info("   export DJANGO_SUPERUSER_PASSWORD='secure-password'")
            logger.info("")
            logger.info("Manual start for testing:")
            logger.info(f"   ./start_gunicorn.sh")
            logger.info("")
            
        except DeploymentError as e:
            logger.error(f"Deployment failed: {e}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Unexpected error during deployment: {e}")
            sys.exit(1)

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Deploy Albirr School Management System')
    parser.add_argument('--project-root', help='Project root directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    deployer = AlbirrDeployer(args.project_root)
    deployer.deploy()

if __name__ == '__main__':
    main()