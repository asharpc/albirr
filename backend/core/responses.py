from rest_framework.response import Response
from rest_framework import status

class APIResponse(Response):
    def __init__(self, data=None, message=None, error=None, status=status.HTTP_200_OK):
        response_data = {
            'status': 'success' if status < 400 else 'error',
            'message': message,
            'data': data,
            'error': error
        }
        super().__init__(data=response_data, status=status)