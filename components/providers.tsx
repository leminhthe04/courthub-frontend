'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
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
  return (
    <QueryClientProvider client={queryClient}>
      <PaymentSocketProvider>{children}</PaymentSocketProvider>
    </QueryClientProvider>
  );
}
