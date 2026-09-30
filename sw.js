// Bump CACHE and V together with PHOTO_V in index.html when photos or icons change,
// so installed phones fetch the new files.
const CACHE = "aa-v3";
const V = "?v=3";
// Each person's first photo is stored up front so the app opens offline;
// the extra photos are saved the first time they appear.
const IDS = [
  "alice", "brolin", "cooper", "curtis", "downey", "elton", "eminem", "farrell",
  "florence", "hardy", "hathaway", "holland", "hopkins", "jackson", "king", "lowe",
  "matsushige", "mcgregor", "oldman", "radcliffe", "ringo", "slash", "washington",
  "tolstoy", "lamott", "billw", "bford", "aldrin", "bush", "ferguson", "maron", "delaney",
  "clapton", "adams",
  "shakespeare", "dostoevsky", "london", "bronte", "zola", "montaigne", "seneca", "plato", "aristotle",
  "franklin", "lincoln", "nietzsche",
];
const PHOTOS = IDS.flatMap(id => [`photos/${id}.jpg${V}`, `photos/wash/${id}.jpg${V}`]);
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

  // Photos and icons: cache first.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
});
