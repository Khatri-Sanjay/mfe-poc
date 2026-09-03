from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent


def load_local_env() -> None:
    env_file = BASE_DIR / '.env'
    if not env_file.exists():
        return

    for line in env_file.read_text(encoding='utf-8').splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith('#') or '=' not in stripped:
            continue
        key, value = stripped.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()


def env(name: str, default: str = '') -> str:
    return os.getenv(name, default)


def csv_env(name: str, default: str) -> list[str]:
    return [item.strip() for item in env(name, default).split(',') if item.strip()]


SECRET_KEY = env('DJANGO_SECRET_KEY', 'insecure-local-dev-secret')
DEBUG = env('DJANGO_DEBUG', 'true').lower() == 'true'
ALLOWED_HOSTS = csv_env('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')

NEST_API_BASE_URL = env('NEST_API_BASE_URL', 'http://localhost:3000/api/v1').rstrip('/')
IFRAME_CLIENT_ID = env('IFRAME_CLIENT_ID', 'commerce-insights-iframe')
IFRAME_REDIRECT_URI = env('IFRAME_REDIRECT_URI', 'http://localhost:8000/app/')
IFRAME_SCOPES = csv_env('IFRAME_SCOPES', 'product.read,inventory.read,order.read,review.manage')
IFRAME_PARENT_ORIGINS = csv_env(
    'IFRAME_PARENT_ORIGINS',
    'http://localhost:4200,http://localhost:4202',
)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'insights',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'commerce_insights.security.FrameAncestorPolicyMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'commerce_insights.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'commerce_insights.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = []

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
