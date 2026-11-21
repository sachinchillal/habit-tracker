export const environment = {
  production: false,
  appTitle: 'Habit Tracker',
  api: {
    baseUrl: 'http://localhost:3000/api/',
    habitTracker: 'habitTracker/',
    accessCode: ''
  },
  localStorageKey: 'habitTracker',
  brandName: '',
  sso: {
    // Same origin as the app: proxy.conf.json forwards /sso to the SSO dev server (sso: npm run s:proxied).
    url: '/sso/',
    // The awb App.id SSO uses to send users back here. Empty = use api.accessCode.
    appId: '',
  },
};