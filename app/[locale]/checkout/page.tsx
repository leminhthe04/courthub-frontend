import { Suspense } from 'react';
import { CheckoutView } from '../../../components/checkout-view';

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-6xl p-12 text-center text-slate-500">Loading...</div>}
    >
      <CheckoutView />
    </Suspense>
  );
}
