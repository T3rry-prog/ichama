var CACHE_NAME = 'ichama-v1';
var STATIC = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/signup.html',
  '/chama.html',
  '/contribute.html',
  '/withdraw.html',
  '/vote.html',
  '/members.html',
  '/activity.html',
  '/profile.html',
  '/rules.html',
  '/settings.html',
  '/notifications.html',
  '/create-chama.html',
  '/join-chama.html',
  '/edit-profile.html',
  '/change-password.html'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Network first for API calls
  if (e.request.url.includes('supabase.co') || e.request.url.includes('resend.com')) {
    return;
  }
  // Cache first for everything else
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return res;
      });
    }).catch(function() {
      return caches.match('/dashboard.html');
    })
  );
});
