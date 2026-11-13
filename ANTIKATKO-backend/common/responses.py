"""
Standardized JSON responses for ANTIKATKO API.
Strictly adheres to the Frontend API Contract:
- Success: {"success": True, "message": "...", "data": {...}}
- Error:   {"success": False, "message": "...", "errors": {...}}
"""
from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Operation completed successfully.", status_code=status.HTTP_200_OK):
    """
    Standard successful JSON response wrapper.
    """
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    return Response(payload, status=status_code)


def error_response(message="Validation failed.", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Standard error JSON response wrapper.
    """
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else {},
    }
    return Response(payload, status=status_code)
