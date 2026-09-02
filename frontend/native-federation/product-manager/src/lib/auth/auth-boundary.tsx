'use client';

import { useEffect, useState } from 'react';
import { AUTH_EXPIRED_EVENT, bootstrapAuthSession } from './api-client';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, tokenStorage } from './token-storage';
import { LoadingBlock } from '@/components/loading-block';
import { getProductManagerConfig } from '@/lib/config/product-manager-config';

export function AuthBoundary({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ready' | 'missing'>('checking');

  useEffect(() => {
    let active = true;

    async function check() {
      const ok = await bootstrapAuthSession();
      if (active) setStatus(ok ? 'ready' : 'missing');
    }

    void check();

    function onExpired() {
      setStatus('missing');
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== ACCESS_TOKEN_KEY && event.key !== REFRESH_TOKEN_KEY) return;

      if (tokenStorage.getAccessToken() || tokenStorage.getRefreshToken()) {
        setStatus('checking');
        void check();
      } else {
        setStatus('missing');
      }
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    window.addEventListener('storage', onStorage);

    return () => {
      active = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (status !== 'missing') return;

    const { loginUrl, redirectOnMissingAuth } = getProductManagerConfig();

    if (redirectOnMissingAuth && loginUrl) window.location.assign(loginUrl);
  }, [status]);

  if (status === 'checking') {
    return (
      <div className="auth-screen">
        <div className="card auth-card">
          <LoadingBlock label="Checking shared session..." />
        </div>
      </div>
    );
  }

  if (status === 'missing') {
    const { loginUrl } = getProductManagerConfig();

    return (
      <div className="auth-screen">
        <div className="card auth-card">
          <h1>Session unavailable</h1>
          <p className="muted">
            This product manager does not contain a login screen. It expects the other application on the same origin to store
            <strong> access_token</strong> and <strong>refresh_token</strong> in localStorage.
          </p>
          {loginUrl ? (
            <a className="btn btn-primary" href={loginUrl}>
              Open login application
            </a>
          ) : (
            <p className="help">Set NEXT_PUBLIC_LOGIN_URL if you want a link back to your separate login application.</p>
          )}
        </div>
      </div>
    );
  }

  return children;
}
