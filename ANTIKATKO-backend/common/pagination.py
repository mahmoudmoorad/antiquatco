"""
Custom pagination classes for ANTIKATKO.
Strictly adheres to the Frontend API Contract:
{
    "success": true,
    "data": {
        "count": 25,
        "next": null,
        "previous": null,
        "results": []
    }
}
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination for catalog, orders, and listing endpoints.
    Default page size is 12 (convenient for 3 or 4 item grids).
    """
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "success": True,
            "data": {
                "count": self.page.paginator.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        })
