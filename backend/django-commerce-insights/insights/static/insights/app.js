(function () {
  const config = loadConfig();
  const allowedParents = new Set(config.parentOrigins);
  let pendingAuthorization = null;
  let accessToken = '';

  const loadingPanel = document.getElementById('loading-panel');
  const errorPanel = document.getElementById('error-panel');
  const errorMessage = document.getElementById('error-message');
  const metricsGrid = document.getElementById('metrics-grid');
  const contentGrid = document.getElementById('content-grid');
  const sessionPill = document.getElementById('session-pill');

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) {
      return;
    }

    if (!allowedParents.has(event.origin)) {
      return;
    }

    if (event.data?.type !== 'commerceos:authorization-code') {
      return;
    }

    void exchangeAuthorizationCode(event.data.payload);
  });

  void requestAuthorizationCode();

  async function requestAuthorizationCode() {
    showLoading();
    try {
      pendingAuthorization = await createPkceAuthorizationRequest();
      allowedParents.forEach((origin) => {
        window.parent.postMessage(
          {
            type: 'commerceos:iframe-ready',
            payload: {
              clientId: config.clientId,
              redirectUri: config.redirectUri,
              scope: config.scope,
              codeChallenge: pendingAuthorization.codeChallenge,
              codeChallengeMethod: 'S256',
              state: pendingAuthorization.state,
            },
          },
          origin,
        );
      });
    } catch {
      showError('Secure iframe authorization could not be initialized.');
    }
  }

  async function exchangeAuthorizationCode(payload) {
    if (!isAuthorizationCodePayload(payload) || !pendingAuthorization) {
      showError('Invalid iframe authorization response.');
      return;
    }

    if (payload.state !== pendingAuthorization.state) {
      showError('Iframe authorization state did not match.');
      return;
    }

    try {
      const response = await fetch('/api/iframe/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          code: payload.code,
          codeVerifier: pendingAuthorization.codeVerifier,
        }),
      });
      pendingAuthorization = null;

      const body = await response.json();
      if (!response.ok || !body.success || typeof body.data?.accessToken !== 'string') {
        throw new Error(body.message || `Request failed with ${response.status}`);
      }

      accessToken = body.data.accessToken;
      await loadDashboard();
    } catch (error) {
      showError(error.message || 'Iframe token exchange failed.');
    }
  }

  async function loadDashboard() {
    showLoading();
    try {
      const response = await fetch('/api/dashboard/summary/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message || `Request failed with ${response.status}`);
      }
      renderDashboard(body.data);
    } catch (error) {
      showError(error.message || 'Dashboard data could not be loaded.');
    }
  }

  function renderDashboard(data) {
    const user = data.user || {};
    sessionPill.textContent = user.email ? `Signed in as ${user.email}` : 'Admin session active';

    const metrics = data.metrics || {};
    replaceChildren(
      metricsGrid,
      metric('Orders', metrics.orders),
      metric('Products', metrics.products),
      metric('Inventory Items', metrics.inventoryItems),
      metric('Low Stock', metrics.lowStockItems),
      metric('Pending Reviews', metrics.pendingReviews),
      metric('Loaded Revenue', money(metrics.loadedRevenue)),
    );

    renderList(
      'low-stock-list',
      data.lowStock || [],
      (item) => row(item.sku || item.variantId, item.productName, `${item.quantityAvailable || 0} left`),
    );
    renderList(
      'orders-list',
      data.recentOrders || [],
      (item) => row(`#${String(item.id || '').slice(0, 8)}`, item.status, money(item.grandTotal, item.currency)),
    );
    renderList(
      'reviews-list',
      data.pendingReviews || [],
      (item) => row(item.title || item.id, `Rating ${item.rating || '-'}`, item.status),
    );
    renderList(
      'products-list',
      data.products || [],
      (item) => row(item.name || item.id, item.status, `${item.reviewCount || 0} reviews`),
    );

    setText('low-stock-count', `${(data.lowStock || []).length} items`);
    setText('orders-count', `${(data.recentOrders || []).length} loaded`);
    setText('reviews-count', `${(data.pendingReviews || []).length} pending`);
    setText('products-count', `${(data.products || []).length} loaded`);

    loadingPanel.classList.add('hidden');
    errorPanel.classList.add('hidden');
    metricsGrid.classList.remove('hidden');
    contentGrid.classList.remove('hidden');
  }

  function metric(label, value) {
    const card = document.createElement('article');
    const labelElement = document.createElement('span');
    const valueElement = document.createElement('strong');

    card.className = 'metric-card';
    labelElement.textContent = label;
    valueElement.textContent = formatValue(value);

    card.append(labelElement, valueElement);
    return card;
  }

  function row(title, subtitle, tag) {
    const rowElement = document.createElement('div');
    const textGroup = document.createElement('div');
    const titleElement = document.createElement('strong');
    const subtitleElement = document.createElement('small');
    const tagElement = document.createElement('span');

    rowElement.className = 'row';
    tagElement.className = 'tag';
    titleElement.textContent = title || 'Untitled';
    subtitleElement.textContent = subtitle || '';
    tagElement.textContent = tag || '';

    textGroup.append(titleElement, subtitleElement);
    rowElement.append(textGroup, tagElement);
    return rowElement;
  }

  function renderList(id, items, renderer) {
    const element = document.getElementById(id);
    if (!element) return;
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No items loaded.';
      replaceChildren(element, empty);
      return;
    }
    replaceChildren(element, ...items.map(renderer));
  }

  function showLoading() {
    loadingPanel.classList.remove('hidden');
    errorPanel.classList.add('hidden');
    metricsGrid.classList.add('hidden');
    contentGrid.classList.add('hidden');
  }

  function showError(message) {
    loadingPanel.classList.add('hidden');
    metricsGrid.classList.add('hidden');
    contentGrid.classList.add('hidden');
    errorMessage.textContent = message;
    errorPanel.classList.remove('hidden');
  }

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function money(value, currency) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'AUD',
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  function formatValue(value) {
    if (value === undefined || value === null) return '0';
    return String(value);
  }

  function loadConfig() {
    const fallback = {
      parentOrigins: [],
      clientId: '',
      redirectUri: '',
      scope: [],
    };
    const script = document.getElementById('commerce-insights-config');
    try {
      const parsed = JSON.parse(script?.textContent || '{}');
      return {
        parentOrigins: Array.isArray(parsed.parentOrigins)
          ? parsed.parentOrigins.filter((origin) => typeof origin === 'string' && origin.startsWith('http'))
          : [],
        clientId: typeof parsed.clientId === 'string' ? parsed.clientId : '',
        redirectUri: typeof parsed.redirectUri === 'string' ? parsed.redirectUri : '',
        scope: Array.isArray(parsed.scope)
          ? parsed.scope.filter((scope) => typeof scope === 'string')
          : ['product.read', 'inventory.read', 'order.read', 'review.manage'],
      };
    } catch {
      return fallback;
    }
  }

  async function createPkceAuthorizationRequest() {
    const codeVerifier = base64Url(crypto.getRandomValues(new Uint8Array(64)));
    const state = base64Url(crypto.getRandomValues(new Uint8Array(32)));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return {
      codeVerifier,
      state,
      codeChallenge: base64Url(new Uint8Array(digest)),
    };
  }

  function isAuthorizationCodePayload(payload) {
    return (
      payload &&
      typeof payload === 'object' &&
      typeof payload.code === 'string' &&
      payload.code.length > 0 &&
      payload.code.length <= 512 &&
      typeof payload.state === 'string'
    );
  }

  function base64Url(bytes) {
    let value = '';
    bytes.forEach((byte) => {
      value += String.fromCharCode(byte);
    });
    return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  }

  function replaceChildren(element, ...children) {
    element.replaceChildren(...children);
  }
})();
