const withPWA = require("next-pwa")({
  dest: "public", // Output folder for service worker
  register: true, // Auto-register service worker
  skipWaiting: true, // Update immediately
});

module.exports = withPWA({
  experimental: {
    appDir: true,
  },
});
