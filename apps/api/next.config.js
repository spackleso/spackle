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
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type'
          },
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
      },
      {
        source: '/:version/pricing_tables/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization'
          },
        ]
      }
    ]
  }
};


module.exports = withSentryConfig(moduleExports, { silent: true }, {
  hideSourceMaps: true,
});
