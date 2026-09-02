import { AdminShell } from '@/components/admin-shell';
import { AuthBoundary } from '@/lib/auth/auth-boundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthBoundary>
      <AdminShell>{children}</AdminShell>
    </AuthBoundary>
  );
}
