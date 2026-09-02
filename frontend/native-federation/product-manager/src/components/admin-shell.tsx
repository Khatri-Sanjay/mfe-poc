'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Product Manager</div>
        <nav className="sidebar-nav">
          <Link className={`sidebar-link ${pathname.startsWith('/admin/products') ? 'active' : ''}`} href="/admin/products">
            Products
          </Link>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <div className="topbar-title">Store Administration</div>
          <div className="topbar-session">Shared session via localStorage</div>
        </header>
        {children}
      </div>
    </div>
  );
}
