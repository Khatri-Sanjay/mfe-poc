from django.conf import settings


class FrameAncestorPolicyMiddleware:
    """Allow only the configured Angular hosts to embed this Django app."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        origins = ' '.join(settings.IFRAME_PARENT_ORIGINS)
        if request.path == '/app/':
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "base-uri 'none'; "
                "object-src 'none'; "
                "form-action 'none'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' data: https:; "
                f"connect-src 'self' {settings.NEST_API_BASE_URL}; "
                f"frame-ancestors 'self' {origins}"
            )
        else:
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                f"connect-src 'self' {settings.NEST_API_BASE_URL}; "
                f"frame-ancestors 'self' {origins}"
            )
        response['Referrer-Policy'] = 'same-origin'
        response['X-Content-Type-Options'] = 'nosniff'
        return response
