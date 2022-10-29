const { withSentryConfig } = require('@sentry/nextjs');
const withMarkdoc = require('@markdoc/next.js');


module.exports = withMarkdoc(
)(
  withSentryConfig(
    {
      reactStrictMode: true,
      swcMinify: true,
      rootDir: 'src',
      experimental: {
        appDir: true,
      },
      pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md']
    },
    {
      silent: true,
      hideSourceMaps: true,
    }
  ),
);