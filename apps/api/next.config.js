/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const moduleExports = {
  reactStrictMode: true,
  transpilePackages: ['spackle-supabase'],
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/marketing/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.spackle.so'
          }
        ]
      },
      {
        source: '/stripe/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Stripe-Signature'
          },
        ]
      }
    ]
  }
};

const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  hideSourceMaps: true,
};

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
