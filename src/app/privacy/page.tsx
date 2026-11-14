import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="14 November 2026">
      <section className="flex flex-col gap-3">
        <h2>Who we are</h2>
        <p>OjaBook is operated by {'{{legal entity name and registered address}}'}. You can contact us about privacy at {'{{privacy contact email}}'}.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>What we collect</h2>
        <ul>
          <li>Your phone number, used to sign you in with a one time code.</li>
          <li>Your name, if you add it.</li>
          <li>The business records you enter: products, prices, stock, sales, customer names and phone numbers, debts, expenses and staff.</li>
          <li>Technical information such as device type and IP address, kept in security and audit logs.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>How we use it</h2>
        <p>We use your information to run OjaBook for you: to sign you in, keep your records, produce your reports and keep the service secure. Each business can only see its own records.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Your customers</h2>
        <p>When you record customers, you decide what to enter. OjaBook does not send messages to your customers.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Service providers</h2>
        <p>We use service providers for hosting and for sending one time codes by SMS: {'{{hosting provider and region}}'} and {'{{SMS provider}}'}.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Keeping and deleting records</h2>
        <p>Financial records are kept so your books stay accurate. Our retention and deletion rules are {'{{retention and account deletion policy}}'}.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Your rights</h2>
        <p>You can ask to see, correct or delete personal data we hold about you, in line with the Nigeria Data Protection Act 2023. Write to the contact above.</p>
      </section>
    </LegalPage>
  );
}
