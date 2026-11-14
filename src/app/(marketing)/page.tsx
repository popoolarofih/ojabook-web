import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/nav';
import {
  CapabilityStrip, DashboardShowcase, DebtsShowcase, DevicesSection, FaqSection, FeatureCards, FinalCta, Hero, HowItWorks,
  InventoryShowcase, MarketingFooter, ProblemSolution, QuickSaleShowcase, TaglineSection, TrustSection,
} from '@/components/marketing/sections';
import { faq } from '@/content/landing';

export const metadata: Metadata = {
  title: { absolute: 'OjaBook: sales, stock and debts for Nigerian businesses' },
  description:
    'Record sales, manage stock, track customer debts and see your profit. OjaBook works on your phone, even without network. Built for traders, shops and wholesalers in Nigeria.',
  alternates: { canonical: '/' },
};

// FAQ in plain question and answer form, with schema for search and answer engines.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function LandingPage() {
  return (
    <>
      <MarketingNav />
      <main id="main">
        <Hero />
        <CapabilityStrip />
        <ProblemSolution />
        <TaglineSection />
        <FeatureCards />
        <DashboardShowcase />
        <QuickSaleShowcase />
        <InventoryShowcase />
        <DebtsShowcase />
        <DevicesSection />
        <HowItWorks />
        <TrustSection />
        <FaqSection />
        <FinalCta />
      </main>
      <MarketingFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </>
  );
}
