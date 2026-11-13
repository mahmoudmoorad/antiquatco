"""
Custom exception handler for standardized error responses across ANTIKATKO API.
Adheres strictly to the Frontend API Contract:
{
    "success": False,
    "message": "Human readable error message",
    "errors": {...}
}
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class BusinessLogicError(Exception):
    """Base exception for application business rule violations."""
    def __init__(self, message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.errors = errors if errors is not None else {}
        self.status_code = status_code


def custom_exception_handler(exc, context):
    """
    Standardize all exception responses to:
    {
        "success": False,
        "message": "...",
        "errors": {...}
    }
    """
    if isinstance(exc, BusinessLogicError):
        return Response(
            {
                "success": False,
                "message": exc.message,
                "errors": exc.errors,
            },
            status=exc.status_code,
        )

    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred."
        errors = {}

        if isinstance(response.data, dict):
            if "detail" in response.data:
                message = str(response.data["detail"])
                errors = {"detail": str(response.data["detail"])}
            elif "non_field_errors" in response.data:
                message = str(response.data["non_field_errors"][0])
                errors = response.data
            else:
                message = "Validation failed."
                errors = response.data
        elif isinstance(response.data, list) and response.data:
            message = str(response.data[0])
            errors = {"detail": str(response.data[0])}

        response.data = {
            "success": False,
            "message": message,
            "errors": errors,
        }
    else:
        logger.exception("Unhandled server exception: %s", exc)

    return response
