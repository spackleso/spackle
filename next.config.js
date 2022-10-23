const { withSentryConfig } = require('@sentry/nextjs');

const moduleExports = {
  reactStrictMode: true,
  swcMinify: true,
  rootDir: 'src',
};

const sentryWebpackPluginOptions = {
  silent: true,
};

module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
