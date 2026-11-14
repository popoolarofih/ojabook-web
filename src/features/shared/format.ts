import { DateTime } from 'luxon';

/** Dates are shown in the business timezone, in plain words. */
export const formatDate = (iso: string, tz = 'Africa/Lagos') => DateTime.fromISO(iso, { zone: tz }).toFormat('d LLL yyyy');
export const formatDateTime = (iso: string, tz = 'Africa/Lagos') => DateTime.fromISO(iso, { zone: tz }).toFormat('d LLL yyyy, h:mm a');
export const todayIso = (tz = 'Africa/Lagos') => DateTime.now().setZone(tz).toISODate()!;
export const humanize = (s: string) => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
