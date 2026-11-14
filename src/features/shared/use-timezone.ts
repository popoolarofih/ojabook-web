'use client';

import { useActiveMembership } from '@/features/auth/session-store';

export const useTimezone = () => useActiveMembership()?.timezone ?? 'Africa/Lagos';
