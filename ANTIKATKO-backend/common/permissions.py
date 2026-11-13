
"""
Custom permission classes for ANTIKATKO.
Strict distinction between Customer and Admin roles.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_admin_user(user):
    """Check whether an authenticated user has the ANTIKATKO ADMIN role."""
    return bool(
        user
        and user.is_authenticated
        and getattr(user, "role", None) == "ADMIN"
    )


class IsAdminUserRole(BasePermission):
    """Allows access only to authenticated ADMIN accounts."""

    message = "Admin access required."

    def has_permission(self, request, view):
        return is_admin_user(request.user)


class IsCustomerUserRole(BasePermission):
    """Allows access only to authenticated CUSTOMER accounts."""

    message = "Customer access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "CUSTOMER"
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Allows access to object owners or ADMIN users.
    Assumes the object has a `user` attribute or is the user itself.
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if is_admin_user(request.user):
            return True

        if hasattr(obj, "user"):
            return obj.user == request.user

        return obj == request.user


class IsAdminOrReadOnly(BasePermission):
    """Allows read-only access publicly and write access to ADMIN users."""

    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return is_admin_user(request.user)
