import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Terms of use', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="14 November 2026">
      <section className="flex flex-col gap-3">
        <h2>Using OjaBook</h2>
        <p>OjaBook helps you record and understand your business. You are responsible for the accuracy of what you enter and for keeping your sign in secure.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Figures are operational</h2>
        <p>Profit and other figures are calculated from your records. They are not audited accounts, they are not tax advice, and they do not replace a qualified accountant.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Payments</h2>
        <p>OjaBook does not move money. A bank transfer you record stays unverified until it can be confirmed, and unverified transfers are not counted as money collected.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Staff and permissions</h2>
        <p>The owner decides what each staff member can do. The owner is responsible for the actions taken by people they invite.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Fees</h2>
        <p>You can start free. Any future paid plans will be announced before they apply: {'{{pricing terms}}'}.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Availability and liability</h2>
        <p>We work to keep OjaBook available but cannot promise it will never be interrupted. Our liability is limited as set out in {'{{limitation of liability clause}}'}.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria: {'{{jurisdiction and dispute resolution}}'}.</p>
      </section>
    </LegalPage>
  );
}
