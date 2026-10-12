import { VenueBooking } from '../../../../components/venue-booking';

export default async function VenuePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <VenueBooking venueId={id} />;
}
