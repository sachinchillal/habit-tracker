export const environment = {
  production: true,
  appTitle: 'Habit Tracker',
  api: {
    baseUrl: 'http://localhost:3000/api/',
    habitTracker: 'habitTracker/',
    accessCode: ''
  },
  localStorageKey: 'habitTracker',
  brandName: '',
  sso: {
    // Absolute and non-www: SSO sends users back to https://domain.com/habit-tracker/, and the
    // session in localStorage["sso"] is only visible on that same origin.
    // url: 'https://domain.com/sso/',
    // OR
    url: '/sso/',
    // The awb App.id SSO uses to send users back here. Empty = use api.accessCode.
    appId: '',
  },
};