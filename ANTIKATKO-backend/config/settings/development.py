"""
Development settings for ANTIKATKO.
"""
from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

# CORS allows all in local development if specified
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# تم إيقاف الإرسال للتيرمينال مؤقتاً لتفعيل الإرسال الحقيقي عبر SMTP (جيميل) للاختبار
# EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# إعدادات البريد الحقيقي (تعتمد على ملف .env)
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND", 
    "django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL", 
    "ANTIKATKO <noreply@antikatko.com>"
)