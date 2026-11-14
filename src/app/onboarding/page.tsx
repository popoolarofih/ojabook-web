'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { ListSkeleton } from '@/components/ui/surface';
import { refreshMe } from '@/features/auth/bootstrap';
import { useSession } from '@/features/auth/session-store';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { api, errorMessage, unwrap } from '@/lib/api/client';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your business name').max(80),
  category: z.string().min(1, 'Choose the kind of business'),
  phone: z.string().max(25).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
});

/** Business type configures suggestions only. It never restricts what the product can do (guide 1.1). */
export default function OnboardingPage() {
  const ready = useRequireAuth({ needBusiness: false });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const categories = useQuery({ queryKey: ['business-categories'], queryFn: () => unwrap(api.GET('/api/v1/businesses/categories')), enabled: ready });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function submit(v: z.infer<typeof schema>) {
    setError(null);
    try {
      const created = await unwrap(api.POST('/api/v1/businesses', { body: { name: v.name, category: v.category as never, phone: v.phone || undefined, city: v.city || undefined, state: v.state || undefined } }));
      await refreshMe();
      useSession.getState().setActiveBusiness(created.id);
      router.replace('/app');
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center gap-8 bg-soft px-4 py-12">
      <Logo />
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-col gap-1">
          <h1 className="heading-5 text-ink">Set up your business</h1>
          <p className="body-6 text-muted">Currency is Nigerian naira and the timezone is Africa/Lagos. You can change the details later in settings.</p>
        </div>
        {!ready || categories.isLoading ? (
          <ListSkeleton rows={3} />
        ) : (
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
            <Field label="Business name" error={form.formState.errors.name?.message}>
              {(p) => <Input {...p} autoFocus placeholder="Amaka Provisions" {...form.register('name')} />}
            </Field>
            <Field label="Kind of business" error={form.formState.errors.category?.message}>
              {(p) => (
                <Select {...p} defaultValue="" {...form.register('category')}>
                  <option value="" disabled>Choose one</option>
                  {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Business phone (optional)" error={form.formState.errors.phone?.message}>
              {(p) => <Input {...p} type="tel" inputMode="tel" placeholder="0801 234 5678" {...form.register('phone')} />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City (optional)">{(p) => <Input {...p} placeholder="Ibadan" {...form.register('city')} />}</Field>
              <Field label="State (optional)">{(p) => <Input {...p} placeholder="Oyo" {...form.register('state')} />}</Field>
            </div>
            {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
            <Button type="submit" size="lg" block loading={form.formState.isSubmitting} loadingText="Creating your business">Create business</Button>
          </form>
        )}
      </div>
    </main>
  );
}
