'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Badge, Card, ListSkeleton, PageHeader } from '@/components/ui/surface';
import { signOut } from '@/features/auth/bootstrap';
import { useActiveMembership, useCan, useSession } from '@/features/auth/session-store';
import { formatDateTime } from '@/features/shared/format';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { refreshMe } from '@/features/auth/bootstrap';

export default function SettingsPage() {
  const m = useActiveMembership()!;
  const router = useRouter();
  const qc = useQueryClient();
  const canEdit = useCan('business.update');
  const user = useSession((s) => s.user);
  const business = useQuery({ queryKey: ['business', m.businessId], queryFn: () => unwrap(api.GET('/api/v1/businesses/{id}', { params: { path: { id: m.businessId } } })) });
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => unwrap(api.GET('/api/v1/auth/sessions')) });
  const [f, setF] = useState({ name: '', phone: '', address: '', city: '', state: '' });
  const [profile, setProfile] = useState(user?.name ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (business.data) setF({ name: business.data.name, phone: business.data.phone ?? '', address: business.data.address ?? '', city: business.data.city ?? '', state: business.data.state ?? '' }); }, [business.data]);

  async function saveBusiness() {
    setMsg(null); setError(null);
    try {
      await unwrap(api.PATCH('/api/v1/businesses/{id}', { params: { path: { id: m.businessId } }, body: { name: f.name, phone: f.phone || undefined, address: f.address || undefined, city: f.city || undefined, state: f.state || undefined } }));
      await refreshMe(); await qc.invalidateQueries({ queryKey: ['business'] }); setMsg('Business details saved.');
    } catch (e) { setError(errorMessage(e)); }
  }
  async function saveProfile() {
    setMsg(null); setError(null);
    try { await unwrap(api.PATCH('/api/v1/auth/me', { body: { name: profile } })); await refreshMe(); setMsg('Your name was saved.'); } catch (e) { setError(errorMessage(e)); }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" />
      {msg ? <p role="status" className="body-5 rounded-lg bg-success-tint p-3 text-success-ink">{msg}</p> : null}
      {error ? <p role="alert" className="body-5 rounded-lg bg-danger-tint p-3 text-danger">{error}</p> : null}

      <Card className="flex flex-col gap-4">
        <h2 className="title-2 text-ink">Your account</h2>
        <p className="body-6 text-muted">Signed in as {user?.phone}</p>
        <Field label="Your name">{(p) => <Input {...p} value={profile} onChange={(e) => setProfile(e.target.value)} />}</Field>
        <Button className="self-start" variant="secondary" onClick={saveProfile} disabled={profile.trim().length < 2}>Save name</Button>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><h2 className="title-2 text-ink">Business</h2><Badge>{m.currency}, {m.timezone}</Badge></div>
        {business.isLoading ? <ListSkeleton rows={2} /> : (
          <>
            <Field label="Business name">{(p) => <Input {...p} disabled={!canEdit} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">{(p) => <Input {...p} disabled={!canEdit} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field>
              <Field label="Address">{(p) => <Input {...p} disabled={!canEdit} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}</Field>
              <Field label="City">{(p) => <Input {...p} disabled={!canEdit} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />}</Field>
              <Field label="State">{(p) => <Input {...p} disabled={!canEdit} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} />}</Field>
            </div>
            {canEdit ? <Button className="self-start" onClick={saveBusiness}>Save business details</Button> : <p className="caption-2 text-muted">Only the owner can change business details.</p>}
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="title-2 text-ink">Where you are signed in</h2>
        {sessions.data?.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-b-0">
            <div className="flex flex-col"><span className="body-5 text-ink">{s.deviceName ?? 'A device'} {s.current ? <Badge tone="blue">This device</Badge> : null}</span><span className="caption-2 text-muted">Last used {formatDateTime(s.lastUsedAt, m.timezone)}</span></div>
            {!s.current ? <Button size="sm" variant="secondary" onClick={async () => { await unwrap(api.DELETE('/api/v1/auth/sessions/{id}', { params: { path: { id: s.id } } })); await sessions.refetch(); }}>Sign out</Button> : null}
          </div>
        ))}
        <Button variant="secondary" className="self-start" onClick={async () => { await unwrap(api.POST('/api/v1/auth/logout-all')); await signOut(); router.replace('/'); }}>Sign out of every device</Button>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="title-2 text-ink">More</h2>
        <Link href="/app/sync" className="body-5 text-royal underline">Sync and saved items</Link>
        <Link href="/privacy" className="body-5 text-royal underline">Privacy policy</Link>
        <Link href="/terms" className="body-5 text-royal underline">Terms of use</Link>
      </Card>
    </div>
  );
}
