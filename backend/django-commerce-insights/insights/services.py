from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings


class NestApiError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


class NestAuthError(NestApiError):
    def __init__(self, message: str = 'Invalid or expired token'):
        super().__init__(message, 401)


@dataclass(frozen=True)
class NestClient:
    access_token: str

    def get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        return self._request('GET', path, params=params)

    def _request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f'{settings.NEST_API_BASE_URL}{path}'
        try:
            response = requests.request(
                method,
                url,
                params=params,
                headers={'Authorization': f'Bearer {self.access_token}'},
                timeout=10,
            )
        except requests.RequestException as exc:
            raise NestApiError('NestJS API is unavailable') from exc

        if response.status_code == 401:
            raise NestAuthError()

        if response.status_code == 403:
            raise NestApiError('The current user does not have permission for this data', 403)

        if response.status_code >= 400:
            raise NestApiError('NestJS API request failed', response.status_code)

        return response.json()

    def current_user(self) -> dict[str, Any]:
        return self.get('/auth/me').get('data', {})

    def dashboard_summary(self) -> dict[str, Any]:
        user = self.current_user()
        orders = self.get('/admin/orders', {'page': 1, 'limit': 25, 'sortOrder': 'desc'})
        products = self.get(
            '/admin/products',
            {'page': 1, 'limit': 25, 'sortBy': 'createdAt', 'sortOrder': 'desc'},
        )
        inventory = self.get('/admin/inventory', {'page': 1, 'limit': 100, 'sortOrder': 'desc'})
        reviews = self.get('/admin/reviews', {'page': 1, 'limit': 100, 'sortOrder': 'desc'})

        inventory_items = inventory.get('data') or []
        review_items = reviews.get('data') or []
        order_items = orders.get('data') or []
        product_items = products.get('data') or []

        low_stock = [
            item
            for item in inventory_items
            if int(item.get('quantityAvailable') or 0) <= int(item.get('reorderLevel') or 0)
        ]
        pending_reviews = [item for item in review_items if item.get('status') == 'PENDING']

        return {
            'user': user,
            'metrics': {
                'orders': orders.get('meta', {}).get('total', len(order_items)),
                'products': products.get('meta', {}).get('total', len(product_items)),
                'inventoryItems': inventory.get('meta', {}).get('total', len(inventory_items)),
                'lowStockItems': len(low_stock),
                'reviews': reviews.get('meta', {}).get('total', len(review_items)),
                'pendingReviews': len(pending_reviews),
                'loadedRevenue': self._loaded_revenue(order_items),
            },
            'recentOrders': order_items[:8],
            'lowStock': low_stock[:8],
            'pendingReviews': pending_reviews[:8],
            'products': product_items[:8],
        }

    def _loaded_revenue(self, orders: list[dict[str, Any]]) -> float:
        total = 0.0
        for order in orders:
            try:
                total += float(order.get('grandTotal') or 0)
            except (TypeError, ValueError):
                continue
        return round(total, 2)


def bearer_token(auth_header: str) -> str:
    if not auth_header.startswith('Bearer '):
        raise NestAuthError('Missing bearer token')
    token = auth_header.removeprefix('Bearer ').strip()
    if not token:
        raise NestAuthError('Missing bearer token')
    return token


def exchange_iframe_code(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        response = requests.post(
            f'{settings.NEST_API_BASE_URL}/auth/iframe/token',
            json={
                'clientId': settings.IFRAME_CLIENT_ID,
                'redirectUri': settings.IFRAME_REDIRECT_URI,
                'code': payload.get('code'),
                'codeVerifier': payload.get('codeVerifier'),
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        raise NestApiError('NestJS API is unavailable') from exc

    if response.status_code == 401:
        raise NestAuthError('Iframe authorization code is invalid')

    if response.status_code >= 400:
        raise NestApiError('Iframe token exchange failed', response.status_code)

    body = response.json()
    if not body.get('success'):
        raise NestAuthError(body.get('message') or 'Iframe token exchange failed')

    return body.get('data') or {}
