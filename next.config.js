const withPWA = require("next-pwa")({
  dest: "public", // Output folder for service worker
  register: true, // Auto-register service worker
  skipWaiting: true, // Update immediately
});

module.exports = {
  poweredByHeader: false, // Disable "X-Powered-By" header
  productionBrowserSourceMaps: false, // Reduce source map generation
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['@sentry/react'] = false; // Example: Omit certain libraries
    }
    return config;
  },
};

