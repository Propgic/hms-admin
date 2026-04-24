const PLATFORM = '/platform';

const endpoints = {
  // Auth
  auth: {
    login: `${PLATFORM}/auth/login`,
    forgotPassword: `${PLATFORM}/auth/forgot-password`,
    resetPassword: `${PLATFORM}/auth/reset-password`,
    me: `${PLATFORM}/auth/me`,
    changePassword: `${PLATFORM}/auth/change-password`,
  },

  // Dashboard
  dashboard: {
    stats: `${PLATFORM}/dashboard/stats`,
    hospitalGrowth: `${PLATFORM}/dashboard/hospital-growth`,
    recentHospitals: `${PLATFORM}/dashboard/recent-hospitals`,
    revenueOverview: `${PLATFORM}/dashboard/revenue-overview`,
  },

  // Hospitals
  hospitals: {
    list: `${PLATFORM}/hospitals`,
    create: `${PLATFORM}/hospitals`,
    get: (id) => `${PLATFORM}/hospitals/${id}`,
    update: (id) => `${PLATFORM}/hospitals/${id}`,
    delete: (id) => `${PLATFORM}/hospitals/${id}`,
    toggleStatus: (id) => `${PLATFORM}/hospitals/${id}/toggle-status`,
    stats: (id) => `${PLATFORM}/hospitals/${id}/stats`,
    subscriptions: (id) => `${PLATFORM}/hospitals/${id}/subscriptions`,
  },

  // Plans
  plans: {
    list: `${PLATFORM}/plans`,
    create: `${PLATFORM}/plans`,
    get: (id) => `${PLATFORM}/plans/${id}`,
    update: (id) => `${PLATFORM}/plans/${id}`,
    delete: (id) => `${PLATFORM}/plans/${id}`,
  },

  // Billing / Subscriptions
  billing: {
    list: `${PLATFORM}/billing`,
    get: (id) => `${PLATFORM}/billing/${id}`,
    stats: `${PLATFORM}/billing/stats`,
  },

  // FAQs
  faqs: {
    list: `${PLATFORM}/faqs`,
    create: `${PLATFORM}/faqs`,
    get: (id) => `${PLATFORM}/faqs/${id}`,
    update: (id) => `${PLATFORM}/faqs/${id}`,
    delete: (id) => `${PLATFORM}/faqs/${id}`,
    reorder: `${PLATFORM}/faqs/reorder`,
  },

  // FAQ Categories
  faqCategories: {
    list: `${PLATFORM}/faq-categories`,
    create: `${PLATFORM}/faq-categories`,
    get: (id) => `${PLATFORM}/faq-categories/${id}`,
    update: (id) => `${PLATFORM}/faq-categories/${id}`,
    delete: (id) => `${PLATFORM}/faq-categories/${id}`,
  },

  // Activity Logs
  activityLogs: {
    list: `${PLATFORM}/activity-logs`,
    get: (id) => `${PLATFORM}/activity-logs/${id}`,
  },

  // Reports
  reports: {
    overview: `${PLATFORM}/reports/overview`,
    revenue: `${PLATFORM}/reports/revenue`,
    hospitals: `${PLATFORM}/reports/hospitals`,
    plans: `${PLATFORM}/reports/plans`,
  },

  // Public platform settings (no auth)
  publicSettings: `${PLATFORM}/public-settings`,

  // Notifications
  notifications: {
    list: `${PLATFORM}/notifications`,
  },

  // Settings
  settings: {
    profile: `${PLATFORM}/settings/profile`,
    updateProfile: `${PLATFORM}/settings/profile`,
    changePassword: `${PLATFORM}/settings/profile/password`,
    platform: `${PLATFORM}/settings/platform`,
    updatePlatform: `${PLATFORM}/settings/platform`,
  },
};

export default endpoints;
