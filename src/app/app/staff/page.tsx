'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from '@phosphor-icons/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/form';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { formatDate, humanize } from '@/features/shared/format';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap, type Schemas } from '@/lib/api/client';

type Role = 'MANAGER' | 'CASHIER' | 'INVENTORY_MANAGER';
const ROLES: { id: Role; label: string; note: string }[] = [
  { id: 'MANAGER', label: 'Manager', note: 'Runs daily operations, sees reports and profit' },
  { id: 'CASHIER', label: 'Cashier', note: 'Records sales. Cannot see profit or change settings' },
  { id: 'INVENTORY_MANAGER', label: 'Inventory manager', note: 'Manages products and stock. No financial access' },
];

export default function StaffPage() {
  const qc = useQueryClient();
  const tz = useTimezone();
  const businessId = useSession((s) => s.activeBusinessId)!;
  const canInvite = useCan('members.invite');
  const canManage = useCan('members.manage');
  const [inviting, setInviting] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');
  const [created, setCreated] = useState<Schemas['CreatedInvitationDto'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Schemas['MemberDto'] | null>(null);
  const [editRole, setEditRole] = useState<Role>('CASHIER');
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);

  const members = useQuery({ queryKey: ['members', businessId], queryFn: () => unwrap(api.GET('/api/v1/businesses/{id}/members', { params: { path: { id: businessId } } })) });
  const invites = useQuery({ queryKey: ['invitations', businessId], enabled: canInvite, queryFn: () => unwrap(api.GET('/api/v1/businesses/{id}/invitations', { params: { path: { id: businessId } } })) });

  async function invite() {
    setError(null);
    try {
      setCreated(await unwrap(api.POST('/api/v1/businesses/{id}/invitations', { params: { path: { id: businessId } }, body: { phone, role } })));
      await qc.invalidateQueries({ queryKey: ['invitations'] });
    } catch (e) { setError(errorMessage(e)); }
  }
  const link = created ? `${window.location.origin}/invite?token=${created.token}` : '';

  async function saveMember(status?: 'ACTIVE' | 'SUSPENDED') {
    if (!editing) return;
    setError(null);
    try {
      await unwrap(api.PATCH('/api/v1/members/{memberId}', { params: { path: { memberId: editing.id } }, body: { role: status ? undefined : editRole, status, reason } }));
      await qc.invalidateQueries({ queryKey: ['members'] });
      setEditing(null); setReason('');
    } catch (e) { setError(errorMessage(e)); }
  }
  async function remove() {
    if (!editing) return;
    try {
      await unwrap(api.DELETE('/api/v1/members/{memberId}', { params: { path: { memberId: editing.id }, query: { reason: reason || 'Removed by owner' } } }));
      await qc.invalidateQueries({ queryKey: ['members'] });
      setEditing(null); setReason('');
    } catch (e) { setError(errorMessage(e)); }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Staff" subtitle="Who can use this business, and what they can do" actions={canInvite ? <Button onClick={() => { setCreated(null); setError(null); setPhone(''); setInviting(true); }}><UserPlus size={20} /> Invite staff</Button> : undefined} />
      {members.isLoading ? <ListSkeleton rows={3} /> : members.isError ? <ErrorState message={errorMessage(members.error)} onRetry={() => members.refetch()} /> : (
        <Card className="p-0 md:p-0"><ul className="divide-y divide-line">
          {members.data?.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex flex-col gap-1"><span className="body-4 text-ink">{m.name ?? m.phone}</span><span className="caption-2 text-muted">{m.name ? m.phone : ''}</span><span className="flex gap-1"><Badge tone={m.role === 'OWNER' ? 'blue' : 'neutral'}>{humanize(m.role)}</Badge>{m.status === 'SUSPENDED' ? <Badge tone="red">Suspended</Badge> : null}</span></div>
              {canManage && m.role !== 'OWNER' ? <Button variant="secondary" size="sm" onClick={() => { setEditing(m); setEditRole(m.role as Role); setReason(''); setError(null); }}>Manage</Button> : null}
            </li>
          ))}
        </ul></Card>
      )}
      {invites.data && invites.data.length > 0 ? (
        <Card className="flex flex-col gap-2"><h2 className="title-3 text-ink">Waiting to join</h2><ul className="divide-y divide-line">{invites.data.map((i) => <li key={i.id} className="flex justify-between py-3"><span className="body-5 text-ink">{i.phone} <Badge>{humanize(i.role)}</Badge></span><span className="caption-2 text-muted">Expires {formatDate(i.expiresAt, tz)}</span></li>)}</ul></Card>
      ) : null}

      <Dialog open={inviting} onOpenChange={setInviting} title={created ? 'Share this invitation' : 'Invite staff'} description={created ? 'Send this link to them yourself. It works once, for that phone number, and expires in 7 days.' : 'They sign in with their phone number and join your business.'}>
        {created ? (
          <div className="flex flex-col gap-3">
            <Input readOnly aria-label="Invitation link" value={link} onFocus={(e) => e.currentTarget.select()} />
            <Button size="lg" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }}>{copied ? 'Copied' : 'Copy link'}</Button>
            <p className="caption-2 text-muted">For security the link is shown only now. OjaBook does not send it for you.</p>
          </div>
        ) : (
          <>
            <Field label="Phone number">{(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus placeholder="0803 456 7890" />}</Field>
            <Field label="Role" hint={ROLES.find((r) => r.id === role)?.note}>{(p) => (<Select {...p} value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</Select>)}</Field>
            {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
            <Button size="lg" block onClick={invite}>Create invitation</Button>
          </>
        )}
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={`Manage ${editing?.name ?? editing?.phone ?? ''}`} description="Changes take effect straight away and are recorded with your reason.">
        <Field label="Role">{(p) => (<Select {...p} value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</Select>)}</Field>
        <Field label="Reason for the change" error={error ?? undefined}>{(p) => <Input {...p} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Promoted to run the shop" />}</Field>
        <Button size="lg" block onClick={() => saveMember()}>Save role</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => saveMember(editing?.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}>{editing?.status === 'SUSPENDED' ? 'Restore access' : 'Suspend access'}</Button>
          <Button variant="danger" onClick={remove}>Remove</Button>
        </div>
      </Dialog>
    </div>
  );
}
