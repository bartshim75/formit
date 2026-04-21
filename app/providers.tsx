'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Suspense, useState } from 'react';
import type { ReactNode } from 'react';

import { PostHogProvider } from '@/components/posthog-provider';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <NuqsAdapter>
      <QueryClientProvider client={client}>
        <Suspense fallback={null}>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
