import { Suspense } from 'react';
import { LoginForm } from '../../../components/auth-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-md p-12 text-center text-slate-500">Loading...</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
