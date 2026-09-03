from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST
import json

from .services import NestApiError, NestAuthError, NestClient, bearer_token, exchange_iframe_code


@require_GET
def app(request):
    return render(
        request,
        'insights/app.html',
        {
            'insights_config': {
                'parentOrigins': settings.IFRAME_PARENT_ORIGINS,
                'clientId': settings.IFRAME_CLIENT_ID,
                'redirectUri': settings.IFRAME_REDIRECT_URI,
                'scope': settings.IFRAME_SCOPES,
            },
        },
    )


@require_GET
def health(request):
    return JsonResponse({'status': 'ok', 'service': 'django-commerce-insights'})


@require_GET
def session_me(request):
    return _with_nest(request, lambda client: {'user': client.current_user()})


@require_GET
def dashboard_summary(request):
    return _with_nest(request, lambda client: client.dashboard_summary())


@csrf_exempt
@require_POST
def iframe_token(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'success': False, 'message': 'Invalid token exchange payload'}, status=400)

    try:
        data = exchange_iframe_code(payload)
        return JsonResponse({'success': True, 'data': data})
    except NestAuthError as exc:
        return JsonResponse({'success': False, 'message': str(exc)}, status=401)
    except NestApiError as exc:
        return JsonResponse({'success': False, 'message': str(exc)}, status=exc.status_code)


def _with_nest(request, handler):
    try:
        token = bearer_token(request.headers.get('Authorization', ''))
        data = handler(NestClient(token))
        return JsonResponse({'success': True, 'data': data})
    except NestAuthError as exc:
        return JsonResponse({'success': False, 'message': str(exc)}, status=401)
    except NestApiError as exc:
        return JsonResponse({'success': False, 'message': str(exc)}, status=exc.status_code)
