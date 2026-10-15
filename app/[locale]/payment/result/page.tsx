import { PaymentResultView } from '../../../../components/payment-result-view';

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string; cancelled?: string }>;
}) {
  const { paymentId } = await searchParams;
  const { cancelled } = await searchParams;
  return <PaymentResultView paymentId={paymentId ?? ''} cancelled={cancelled === '1'} />;
}
