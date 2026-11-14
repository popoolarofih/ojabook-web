'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useSession } from '@/features/auth/session-store';
import { api, ApiError, errorMessage, unwrap } from '@/lib/api/client';

const phoneSchema = z.object({ phone: z.string().trim().min(10, 'Enter your phone number').max(25) });
const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'The code is 6 digits') });

/** Phone number, then the one time code. No password to remember (guide 4.1). */
export default function LoginPage() {
  const router = useRouter();
  const status = useSession((s) => s.status);
  const memberships = useSession((s) => s.memberships);
  const [phone, setPhone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (status === 'authenticated') router.replace(memberships.length ? '/app' : '/onboarding');
  }, [status, memberships.length, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm<z.infer<typeof codeSchema>>({ resolver: zodResolver(codeSchema) });

  async function requestCode(value: string) {
    setFormError(null);
    try {
      const res = await unwrap(api.POST('/api/v1/auth/otp/request', { body: { phone: value } }));
      setPhone(value);
      setResendIn(res.resendAfterSeconds);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'OTP_RESEND_TOO_SOON') {
        setPhone(value);
        setResendIn((e.details as { retryAfterSeconds?: number })?.retryAfterSeconds ?? 30);
      } else setFormError(errorMessage(e));
    }
  }

  async function verify({ code }: z.infer<typeof codeSchema>) {
    setFormError(null);
    try {
      const res = await unwrap(api.POST('/api/v1/auth/otp/verify', { body: { phone: phone!, code, deviceName: navigator.userAgent.slice(0, 80) } }));
      useSession.getState().setAccessToken(res.accessToken);
      useSession.getState().setMe({ user: res.user, memberships: res.memberships });
    } catch (e) {
      setFormError(errorMessage(e));
    }
  }

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-soft px-4 py-12">
      <Link href="/" aria-label="OjaBook home"><Logo /></Link>
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-line bg-white p-6">
        {phone === null ? (
          <form onSubmit={phoneForm.handleSubmit((v) => requestCode(v.phone))} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1">
              <h1 className="heading-5 text-ink">Sign in or create your account</h1>
              <p className="body-6 text-muted">Enter your phone number. We send a one time code.</p>
            </div>
            <Field label="Phone number" hint="For example 0801 234 5678" error={phoneForm.formState.errors.phone?.message}>
              {(p) => <Input {...p} type="tel" inputMode="tel" autoComplete="tel" autoFocus placeholder="0801 234 5678" {...phoneForm.register('phone')} />}
            </Field>
            {formError ? <p role="alert" className="body-5 text-danger">{formError}</p> : null}
            <Button type="submit" size="lg" block loading={phoneForm.formState.isSubmitting} loadingText="Sending code">Send code</Button>
          </form>
        ) : (
          <form onSubmit={codeForm.handleSubmit(verify)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1">
              <h1 className="heading-5 text-ink">Enter your code</h1>
              <p className="body-6 text-muted">We sent a 6 digit code to {phone}. It works for 5 minutes.</p>
            </div>
            <Field label="One time code" error={codeForm.formState.errors.code?.message}>
              {(p) => <Input {...p} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus placeholder="123456" className="tabular tracking-widest" {...codeForm.register('code')} />}
            </Field>
            {formError ? <p role="alert" className="body-5 text-danger">{formError}</p> : null}
            <Button type="submit" size="lg" block loading={codeForm.formState.isSubmitting} loadingText="Checking">Continue</Button>
            <div className="flex items-center justify-between">
              <button type="button" className="button-sm rounded-lg px-2 py-1 text-royal transition-oja hover:bg-royal-tint" onClick={() => { setPhone(null); setFormError(null); codeForm.reset(); }}>
                Change number
              </button>
              <button type="button" disabled={resendIn > 0} className="button-sm rounded-lg px-2 py-1 text-royal transition-oja hover:bg-royal-tint disabled:text-muted disabled:hover:bg-transparent" onClick={() => requestCode(phone)}>
                {resendIn > 0 ? `Send again in ${resendIn}s` : 'Send again'}
              </button>
            </div>
          </form>
        )}
      </div>
      <p className="caption-2 max-w-md text-center text-muted">
        By continuing you agree to the <Link href="/terms" className="text-royal underline">terms</Link> and <Link href="/privacy" className="text-royal underline">privacy policy</Link>.
      </p>
    </main>
  );
}
