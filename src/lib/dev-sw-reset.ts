// Development only. A service worker left over from a production run on the
// same localhost port keeps serving its cached /_next/static files, so the dev
// server's fresh code never reaches the page. This removes it, clears its
// caches and reloads once. Inline, because it must run before the app's code.
export const DEV_SW_RESET_SCRIPT = `(function () {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    if (!registrations.length) return;
    Promise.all(registrations.map(function (registration) { return registration.unregister(); }))
      .then(function () {
        return window.caches
          ? caches.keys().then(function (keys) { return Promise.all(keys.map(function (key) { return caches.delete(key); })); })
          : null;
      })
      .then(function () { location.reload(); });
  });
})();`;
