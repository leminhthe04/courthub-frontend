'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AUTH_KEYS } from '../hooks/use-auth';
import { showToast } from '../lib/toast';
import { PaymentSocketProvider } from './payment-socket-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false },
        },
      }),
  );

  useEffect(() => {
    const handleInactiveAccount = () => {
      const isVietnamese = window.location.pathname.split('/').includes('vi');
      showToast.error(
        isVietnamese
          ? 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
          : 'Your account has been deactivated. Please contact an administrator.',
      );
      queryClient.setQueryData(AUTH_KEYS.me, null);
      void queryClient.cancelQueries({ queryKey: AUTH_KEYS.me });
    };

    window.addEventListener('courthub:account-inactive', handleInactiveAccount);
    return () => window.removeEventListener('courthub:account-inactive', handleInactiveAccount);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <PaymentSocketProvider>{children}</PaymentSocketProvider>
    </QueryClientProvider>
  );
}
