'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Bottom sheet on phones, centred modal on larger screens. Focus is trapped and Escape closes it. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-charcoal/60" />
        <RadixDialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-2xl bg-white p-4 md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:p-6',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <RadixDialog.Title className="heading-6 text-ink">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="body-6 text-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition-oja hover:bg-soft">
              <X size={20} />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
