const titles = [
  { match: /^\/$/, title: 'Dashboard' },
  { match: /^\/hospitals\/[^/]+/, title: 'Hospital Details' },
  { match: /^\/hospitals/, title: 'Hospitals' },
  { match: /^\/plans/, title: 'Subscription Plans' },
  { match: /^\/billing/, title: 'Billing' },
  { match: /^\/invoices\/[^/]+/, title: 'Invoice Details' },
  { match: /^\/invoices/, title: 'Invoices' },
  { match: /^\/coupons/, title: 'Coupons' },
  { match: /^\/faqs/, title: 'FAQs' },
  { match: /^\/activity-logs/, title: 'Activity Logs' },
  { match: /^\/reports/, title: 'Reports & Analytics' },
  { match: /^\/settings/, title: 'Settings' },
];

export function getPageTitle(pathname) {
  return titles.find((t) => t.match.test(pathname))?.title || '';
}
