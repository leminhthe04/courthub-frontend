'use client';

import { useEffect } from 'react';
import { VenueExplorer } from '../../components/venue-explorer';
import { useCurrentUser } from '../../hooks';
import { useRouter } from '../../lib/i18n/routing';

export default function HomePage() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role === 'PARTNER') {
      router.replace('/partner');
    }
  }, [user, isLoading, router]);

  if (!isLoading && user?.role === 'PARTNER') {
    return null;
  }

  return <VenueExplorer />;
}
