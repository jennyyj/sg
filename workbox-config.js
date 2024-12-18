module.exports = {
	globDirectory: "app/", // Update to your root directory
	globPatterns: ["**/*.{html,js,css,ts,tsx,ico,woff,woff2}"], // File types to cache
	globIgnores: [
	  "**/node_modules/**/*",
	  "sw.js" // Ignore the generated service worker itself
	],
	swDest: "public/sw.js", // Output service worker file location
	swSrc: "app/sw-template.js" // Path to your custom service worker template
  };
  