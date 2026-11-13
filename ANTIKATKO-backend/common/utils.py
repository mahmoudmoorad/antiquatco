"""
Shared utility functions for ANTIKATKO.
"""
import os
import uuid
from datetime import datetime
from django.core.exceptions import ValidationError


def generate_order_number() -> str:
    """
    Generate a human-friendly unique order number.
    Format: ANT-YYYYMMDD-XXXXXX (e.g. ANT-20261107-A1B2C3)
    """
    date_part = datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"ANT-{date_part}-{unique_suffix}"


def validate_image_file(image_file, max_size_mb=5):
    """
    Validate uploaded image file type and size.
    Allowed extensions: jpg, jpeg, png, webp.
    Max size: max_size_mb (default 5MB).
    """
    if not image_file:
        return

    ext = os.path.splitext(image_file.name)[1].lower()
    valid_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    if ext not in valid_extensions:
        raise ValidationError(
            f"Unsupported file extension '{ext}'. Allowed extensions are: {', '.join(valid_extensions)}"
        )

    max_bytes = max_size_mb * 1024 * 1024
    if image_file.size > max_bytes:
        raise ValidationError(
            f"File size exceeds maximum allowed limit of {max_size_mb}MB."
        )


def product_image_upload_path(instance, filename):
    """
    Generate clean storage path for product images.
    """
    ext = os.path.splitext(filename)[1].lower()
    unique_id = uuid.uuid4().hex
    product_id = instance.product_id if hasattr(instance, "product_id") and instance.product_id else "general"
    return f"products/{product_id}/{unique_id}{ext}"


def category_image_upload_path(instance, filename):
    """
    Generate clean storage path for category images.
    """
    ext = os.path.splitext(filename)[1].lower()
    unique_id = uuid.uuid4().hex
    return f"categories/{unique_id}{ext}"
