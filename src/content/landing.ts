/**
 * All landing page copy lives here so it can be tested against the copy rules:
 * no hyphens, no banned filler words, no exclamation marks, sentence case.
 *
 * Nothing here invents facts. There are no testimonials, customer logos, user counts or prices,
 * because none exist yet (skill B8). The numbers inside product previews are demonstration data
 * and are labelled as such wherever they appear.
 */

export const hero = {
  headline: 'Your business. Your numbers. Your control.',
  subheadline:
    'Record every sale, watch your stock, see who owes you and know your real profit. OjaBook works on your phone, even when the network does not.',
  primaryCta: 'Get started free',
  secondaryCta: 'Explore OjaBook',
  proof: 'Built for market traders, shops and wholesalers across Nigeria. Every amount is kept in kobo and every record can be traced.',
};

export const navLinks = [
  { id: 'features', label: 'Features' },
  { id: 'quick-sale', label: 'Quick Sale' },
  { id: 'devices', label: 'Works offline' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
] as const;

export const capabilities = [
  { title: 'Works without network', body: 'Sales are saved on your phone first and sent when the network returns.' },
  { title: 'Counts every unit', body: 'Sell by the carton, the bag or the piece. Stock stays correct.' },
  { title: 'Keeps honest books', body: 'Records are never edited behind your back. Mistakes are reversed with a reason.' },
];

export const problem = {
  eyebrow: 'The problem',
  title: 'Notebooks lose pages. Memory loses money.',
  body: 'When sales sit in a notebook, stock lives in your head and debts hide in WhatsApp chats, you cannot tell what you earned this week. OjaBook puts it all in one place that stays correct.',
  before: ['Sales in a notebook', 'Stock counted by guessing', 'Debts remembered by memory', 'Profit known only at the end'],
  after: ['Every sale recorded in seconds', 'Stock that reduces by itself', 'Every debt with a name and a date', 'Profit you can read on any day'],
};

export const tagline = 'Every sale recorded. Every kobo accounted for. Every debt remembered. This is how a trader becomes a business owner.';

export const features = [
  { id: 'sales', icon: 'cash', title: 'Sales and POS', body: 'Pick products, set the quantity, choose how the customer paid and print or share the receipt.' },
  { id: 'inventory', icon: 'package', title: 'Inventory', body: 'See what is on hand, what is running low and how every item moved.' },
  { id: 'debts', icon: 'notebook', title: 'Iwe Gbese', body: 'Track customer credit, record part payments and share a statement when you need to.' },
  { id: 'expenses', icon: 'receipt', title: 'Expenses', body: 'Record rent, transport, fuel and wages so profit reflects real costs.' },
  { id: 'reports', icon: 'chart', title: 'Reports', body: 'Sales, collections, debts, expenses and profit for today, this week or any dates you choose.' },
] as const;

export const demo = {
  label: 'Demonstration data',
  period: 'Today',
  revenue: '₦1,284,350',
  collected: '₦962,900',
  owed: '₦321,450',
  expenses: '₦148,250',
  profit: '₦393,220',
  bars: [38, 52, 44, 71, 63, 88, 100],
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  lowStock: [
    { name: 'Golden Penny Semovita 1kg', left: '6 packs' },
    { name: 'Peak Milk Tin 160g', left: '11 tins' },
  ],
};

export const quickSale = {
  eyebrow: 'Quick Sale',
  title: 'From product to receipt in three steps.',
  body: 'The sale screen works like a calculator. Search, tap, set the quantity and choose the payment. Stock and your books update together.',
  steps: [
    { title: 'Choose products', body: 'Search by name or tap a category. Pick the unit, such as a bag or a kilogram.' },
    { title: 'Take payment', body: 'Cash, transfer, credit or a mix. The total must match before you can finish.' },
    { title: 'Share the receipt', body: 'Print it or send it. The sale is saved even if the network is down.' },
  ],
  cart: [
    { name: 'Rice 50kg bag', detail: '1 bag', amount: '₦78,500' },
    { name: 'Vegetable oil 5L', detail: '2 containers', amount: '₦18,700' },
    { name: 'Maggi cubes carton', detail: '1 carton', amount: '₦9,350' },
  ],
  total: '₦106,550',
};

export const inventory = {
  eyebrow: 'Inventory',
  title: 'Know what you have before a customer asks.',
  body: 'Set a base unit and tell OjaBook how your units relate. One carton of twelve pieces sells as a carton or as a piece, and the stock count stays exact.',
  rows: [
    { name: 'Indomie Chicken 70g', unit: 'carton of 40 packs', left: '23 cartons', state: 'In stock' },
    { name: 'Golden Penny Semovita 1kg', unit: 'bag of 10 packs', left: '6 packs', state: 'Low stock' },
    { name: 'Peak Milk Tin 160g', unit: 'carton of 48 tins', left: '11 tins', state: 'Low stock' },
    { name: 'Dangote Sugar 500g', unit: 'carton of 20 packs', left: '15 cartons', state: 'In stock' },
  ],
};

export const debts = {
  eyebrow: 'Iwe Gbese',
  title: 'Every debt has a name, a date and a balance.',
  body: 'Sell on credit to a customer you know. Record part payments as they come. OjaBook stops repayments from going past what is owed and builds a statement you can share when you choose.',
  customers: [
    { name: 'Mama Tunde', owes: '₦64,200', note: 'Due 20 Dec', tone: 'blue' },
    { name: 'Chinedu Okeke', owes: '₦112,750', note: '9 days overdue', tone: 'orange' },
    { name: 'Hajia Bello', owes: '₦23,400', note: 'Part paid', tone: 'blue' },
  ],
};

export const devices = {
  eyebrow: 'Phone, tablet and desktop',
  title: 'Made for the phone in your hand. Roomy on a big screen.',
  body: 'OjaBook is designed for the phone first, with large buttons and few steps. On a laptop you get a wider view for reports and stock. Add it to your home screen and it opens like an app.',
  offlineTitle: 'When the network drops, you keep selling.',
  offlineBody:
    'Sales, customers, payments and expenses are saved on the device first. A clear label shows what is waiting to sync. If two phones sell the last item, nothing is lost: OjaBook keeps both and asks you to decide.',
  states: ['Saved on this device', 'Syncing', 'Synced', 'Needs attention'],
};

export const howItWorks = {
  title: 'Start in minutes, not weeks.',
  steps: [
    { title: 'Sign in with your phone number', body: 'We send a one time code. There is no password to remember.' },
    { title: 'Add your business and products', body: 'Choose your kind of business, set prices and enter the stock you have now.' },
    { title: 'Record your first sale', body: 'Tap, charge and share the receipt. Your dashboard updates straight away.' },
  ],
};

export const trust = {
  title: 'Numbers you can trust',
  body: 'Good decisions need figures that agree with each other. OjaBook is built so they do.',
  points: [
    { title: 'Revenue is not cash', body: 'A credit sale counts as a sale but not as money collected. The dashboard never mixes the two.' },
    { title: 'History does not change', body: 'Edit a product price or cost and old sales keep the price and cost they had. Past profit stays true.' },
    { title: 'Transfers are checked, not assumed', body: 'A bank transfer you type in stays marked as awaiting verification. A screenshot is never treated as proof.' },
    { title: 'Mistakes leave a trail', body: 'Posted records are reversed with a reason and your name on them, never quietly erased.' },
  ],
};

export const faq = [
  {
    q: 'Does OjaBook work without internet?',
    a: 'Yes for recording. Sales, customers, repayments and expenses are saved on your device and sent when the network returns. Creating products and receiving stock need a connection.',
  },
  {
    q: 'What happens if two phones sell the last item?',
    a: 'Both sales are kept. The second one is marked as needing attention, and you choose to adjust it or dismiss it with a reason. Nothing is deleted without your decision.',
  },
  {
    q: 'Can I sell by the carton and by the piece?',
    a: 'Yes. You choose a base unit for each product and define how other units convert, for example one carton equals twelve pieces. Stock is always counted in the base unit.',
  },
  {
    q: 'Does OjaBook confirm bank transfers?',
    a: 'Not yet. A transfer you enter is shown as awaiting verification and is not counted as money collected. Cash you receive is counted straight away.',
  },
  {
    q: 'Can my staff use it?',
    a: 'Yes. You can invite managers, cashiers and inventory managers. Cashiers cannot see profit or change settings, and every sensitive change is recorded with who made it.',
  },
  {
    q: 'Is the profit figure the same as my accountant would report?',
    a: 'No. OjaBook shows an operational profit from the records you enter. It is not an audited statutory account and it does not file taxes.',
  },
  {
    q: 'How do I install it?',
    a: 'Open OjaBook in your phone browser and choose Add to home screen. It then opens like any other app.',
  },
  {
    q: 'What does it cost?',
    a: 'You can start free today. No paid plans have been published yet, and this page will say so when that changes.',
  },
  {
    q: 'Is it only for one type of shop?',
    a: 'No. Provision stores, foodstuff sellers, wholesalers, pharmacies, fashion and other small businesses can all use it. Your business type only sets the suggestions you see when you start.',
  },
];

export const finalCta = {
  title: 'See your whole business on one screen.',
  body: 'Create your account with a phone number and record your first sale today.',
  cta: 'Get started free',
  reassurance: 'You only need your phone number to begin.',
};

export const footer = {
  tagline: 'Know your sales. Track your stock. Understand your money.',
  legalNote: 'OjaBook shows operational figures from your own records. It is not an accounting firm and does not provide tax advice.',
};

/** Every visible string, for the copy rules test. */
export function allCopy(): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => (k === 'icon' || k === 'id' || k === 'tone' ? undefined : walk(x)));
  };
  [hero, navLinks, capabilities, problem, tagline, features, demo, quickSale, inventory, debts, devices, howItWorks, trust, faq, finalCta, footer].forEach(walk);
  return out;
}
