// Bump CACHE when photos or icons change so phones pick up the new files.
const CACHE = "aa-v1";
const PHOTOS = [
  "alice", "brolin", "cooper", "curtis", "downey", "elton", "eminem", "farrell",
  "florence", "hardy", "hathaway", "holland", "hopkins", "jackson", "king", "lowe",
  "matsushige", "mcgregor", "oldman", "radcliffe", "ringo", "slash", "washington",
].map(id => `photos/${id}.jpg`);
const CORE = ["./", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", ...PHOTOS];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function put(req, res) {
  if (res.ok || res.type === "opaque") {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // The page itself: network first so edits show up, cache when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => put(req, res)).catch(() => caches.match(req).then(r => r || caches.match("./"))));
    return;
  }

  // Photos, icons, fonts: cache first.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
});
