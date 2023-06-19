import * as Sentry from '@sentry/electron'

export const initSentry = () => {
  if (process.env.TEST_MODE === 'true') {
    Sentry.init({
      dsn: 'https://1ca88607c3d14e15b36cb2cfd5f16d68@o1060867.ingest.sentry.io/6050774',
      environment: process.env.TEST_MODE ? 'test' : 'production',
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    })
  }
}
