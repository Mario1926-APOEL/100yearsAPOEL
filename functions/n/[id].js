/*  functions/n/[id].js  —  ΑΠΟΕΛ 100 Χρόνια
    ------------------------------------------------------------------
    Δίνει σε κάθε ΑΝΑΚΟΙΝΩΣΗ δική της σελίδα με δικά της Open Graph tags,
    ώστε το WhatsApp / Viber / Facebook / X να δείχνουν τη φωτογραφία
    της ανακοίνωσης αντί για το έμβλημα.

        https://www.apoel100years.org/n/3
              -> preview: cover + τίτλος + περίληψη
              -> ο χρήστης πατάει -> /?news=3

    Διαβάζει τα δεδομένα από το ίδιο το index.html, οπότε ΔΕΝ χρειάζεται
    ποτέ ενημέρωση: προσθέτεις ανακοίνωση και δουλεύει αυτόματα.
*/

const DEFAULT_IMG = '/emblem_reveal.jpg';
const SITE_NAME   = 'ΑΠΟΕΛ · Ένας Αιώνας';

const esc = s => String(s == null ? '' : s)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\s+/g, ' ').trim();

const clamp = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// Το eval δεν επιτρέπεται στα Workers, οπότε τραβάμε τα πεδία με regex.
function field(obj, key) {
  const m = obj.match(new RegExp('\\b' + key + ":'((?:\\\\.|[^'\\\\])*)'"));
  return m ? m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : '';
}

function splitArray(html, name) {
  const m = html.match(new RegExp('const ' + name + '=\\[([\\s\\S]*?)\\n  \\];'));
  if (!m) return [];
  return m[1].split(/\n    (?=\{)/).map(s => s.trim()).filter(s => s.startsWith('{'));
}

/* Αν η εγγραφή δεν έχει δικό της image, παίρνουμε το πρώτο αρχείο του φακέλου
   του άλμπουμ — ίδια λογική και ίδια ταξινόμηση με το site. */
async function albumCover(html, folder, origin) {
  if (!folder) return '';
  const repo = (html.match(/const REPO='([^']+)'/) || [])[1];
  const ref  = (html.match(/const REPO_REF='([^']+)'/) || [])[1] || 'main';
  if (!repo) return '';
  const enc = folder.split('/').map(encodeURIComponent).join('/');
  const isImg = /\.(jpe?g|png|webp)$/i;
  const pick = names => {
    const first = names
      .filter(n => n && !n.includes('/') && isImg.test(n))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))[0];
    return first ? `${origin}/albums/${enc}/${encodeURIComponent(first)}` : '';
  };

  try {
    const r = await fetch(`https://data.jsdelivr.com/v1/packages/gh/${repo}@${ref}/flat`,
                          { cf: { cacheTtl: 1800, cacheEverything: true } });
    if (r.ok) {
      const data = await r.json();
      const prefix = `/albums/${folder}/`;
      const hit = pick((data.files || [])
        .map(f => (typeof f.name === 'string' && f.name.startsWith(prefix)) ? f.name.slice(prefix.length) : ''));
      if (hit) return hit;
    }
  } catch (_) {}

  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/albums/${enc}?ref=${ref}`,
                          { headers: { 'user-agent': 'apoel100-og' }, cf: { cacheTtl: 1800 } });
    if (r.ok) {
      const files = await r.json();
      const hit = pick((Array.isArray(files) ? files : [])
        .filter(f => f.type === 'file').map(f => f.name));
      if (hit) return hit;
    }
  } catch (_) {}

  return '';
}

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  // Δέχεται είτε σταθερό id (π.χ. home-kit-2026-27) είτε παλιό αριθμητικό index
  const id = String(params.id || '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 80);
  const target = `${origin}/?news=${encodeURIComponent(id)}`;

  let title = SITE_NAME, desc = '', image = origin + DEFAULT_IMG, titleEn = '', descEn = '';

  try {
    const res = await fetch(`${origin}/index.html`, {
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    if (res.ok) {
      const html = await res.text();
      // Το site ταξινομεί τις ανακοινώσεις κατά ημερομηνία φθίνουσα πριν τις εμφανίσει,
      // οπότε κάνουμε το ίδιο — αλλιώς τα παλιά αριθμητικά links δείχνουν σε λάθος άρθρο.
      const list = splitArray(html, 'announcements')
        .map((o, n) => ({ o, n, d: Date.parse(field(o, 'date')) || 0 }))
        .sort((x, y) => (y.d - x.d) || (x.n - y.n))
        .map(x => x.o);
      const a = list.find(o => field(o, 'id') === id)
             || (/^\d+$/.test(id) ? list[Number(id)] : null);
      if (a) {
        title   = esc(field(a, 'title')) || title;
        titleEn = esc(field(a, 'title_en')) || title;
        desc    = clamp(esc(field(a, 'excerpt')) || title, 200);
        descEn  = clamp(esc(field(a, 'excerpt_en')) || desc, 200);
        const img = field(a, 'image');
        if (img) {
          image = `${origin}/${img}`;
        } else {
          const cover = await albumCover(html, field(a, 'album'), origin);
          if (cover) image = cover;
        }
      }
    }
  } catch (_) { /* κρατάμε τα defaults και απλώς προωθούμε */ }

  const page = `<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${origin}/n/${id}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="el_GR">
<meta property="og:locale:alternate" content="en_GB">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:alt" content="${titleEn || title}">
<meta property="og:url" content="${origin}/n/${id}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${descEn || desc}">
<meta name="twitter:image" content="${image}">
<link rel="icon" type="image/png" href="${origin}/favicon.png">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)});</script>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#001b35;color:#e0b53a;text-align:center;padding:24px;
       font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
  a{color:#3fa0e0;}
</style>
</head>
<body>
  <div>
    <p>${title}</p>
    <p><a href="${target}">Μετάβαση στη σελίδα → / Continue →</a></p>
  </div>
</body>
</html>`;

  return new Response(page, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=120'
    }
  });
}
