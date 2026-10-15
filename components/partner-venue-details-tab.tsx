'use client';

import { useTranslations } from 'next-intl';
import { useUpdatePartnerVenue } from '../hooks';
import { getLocalizedErrorMessage } from '../lib/formatters';
import { showToast } from '../lib/toast';
import type { VenueDetail } from '../lib/types';
import { PartnerVenueForm } from './partner-venue-form';

interface PartnerVenueDetailsTabProps {
  venue: VenueDetail;
}

export function PartnerVenueDetailsTab({ venue }: PartnerVenueDetailsTabProps) {
  const t = useTranslations('partnerDashboard');
  const tErrors = useTranslations('errors');
  const updateVenue = useUpdatePartnerVenue({
    onSuccess: () => showToast.success(t('venueUpdated')),
    onError: (error) => showToast.error(getLocalizedErrorMessage(error, tErrors)),
  });

  return (
    <section className="mt-8">
      <PartnerVenueForm
        mode="edit"
        venue={venue}
        isSubmitting={updateVenue.isPending}
        onSubmit={(dto) => updateVenue.mutate({ venueId: venue.id, dto })}
      />
    </section>
  );
}
