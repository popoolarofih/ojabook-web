# Landing page brief

Output format required by the landing page design skill, kept so decisions are reviewable.

## Intake (assumptions, since no answers were given)

- **One offer, one audience, one action**: Nigerian traders, retailers and wholesalers; create a free account with a phone number.
- Conversion: a started sign up. Traffic: organic search and word of mouth, so the page is indexed.
- Proof: none exists yet (no testimonials, logos, counts or prices), so none are shown.
- Voice: plain, calm, specific. Design direction: bold and distinctive on a Charcoal hero, calmer below.

## Layout recommendation

**Type A, classic hero plus sections.** The product is understandable from one product preview (the Quick Sale screen), and the guide's section list (5.3) maps directly onto it.

## Page outline

Hero, capability strip, problem to solution, **tagline reveal**, features, dashboard showcase, Quick Sale showcase, inventory showcase, Iwe Gbese showcase, devices and offline, how it works, numbers you can trust, FAQ, final call to action, footer.

## Hero copy

- Headline: *Your business. Your numbers. Your control.*
- Subheadline: *Record every sale, watch your stock, see who owes you and know your real profit. OjaBook works on your phone, even when the network does not.*
- Primary action: **Get started free**. Secondary: Explore OjaBook.
- Proof line: *Built for market traders, shops and wholesalers across Nigeria. Every amount is kept in kobo and every record can be traced.*

## Benefits and steps

See `src/content/landing.ts`. All copy is tested: no hyphens, no banned filler words, no exclamation marks, no claims the product cannot back (`src/content/landing.test.ts`).

## SEO and AEO

Index. Title and description set, canonical URL, Open Graph and Twitter cards, `FAQPage` structured data from the same text as the visible FAQ, sitemap and robots (the app routes are disallowed).

## Ship checklist

Privacy and terms (drafts with placeholders), branded 404, favicon and icons, manifest, skip link, semantic landmarks, alt text and labels, keyboard operable FAQ, reduced motion honoured, no horizontal overflow at 390px and the primary action visible in the first screen (both asserted by Playwright).
