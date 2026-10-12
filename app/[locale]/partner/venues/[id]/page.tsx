import { PartnerVenueManager } from '../../../../../components/partner-venue-manager';

export default async function PartnerVenueManagePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <PartnerVenueManager venueId={id} />;
}
