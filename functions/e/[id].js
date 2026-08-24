const EVENTS = {
  "4": {
    title: "Graffiti Day & Μουσική Βραδιά",
    description: "Τρίτη 01.09.26 · ΠΑΝ.ΣΥ.ΦΙ ΑΠΟΕΛ",
    image: "IMG-99e8a16c72aa7cde08be3d74dacfcbbd-V.jpg",
    target: "/?event=4"
  }
};

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function onRequest(context) {
  const id = String(context.params.id || "");
  const event = EVENTS[id];

  const requestUrl = new URL(context.request.url);
  const origin = requestUrl.origin;

  if (!event) {
    return Response.redirect(`${origin}/`, 302);
  }

  const shareUrl = `${origin}/e/${encodeURIComponent(id)}`;
  const imageUrl = `${origin}/${event.image}`;
  const targetUrl = `${origin}${event.target}`;

  const html = `<!doctype html>
<html lang="el">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title>${esc(event.title)} | ΑΠΟΕΛ 100 ΧΡΟΝΙΑ</title>

  <meta
    name="description"
    content="${esc(event.description)}"
  >

  <!-- WhatsApp / Viber / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ΑΠΟΕΛ · 100 ΧΡΟΝΙΑ">
  <meta property="og:title" content="${esc(event.title)}">
  <meta property="og:description" content="${esc(event.description)}">

  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:image:secure_url" content="${esc(imageUrl)}">
  <meta property="og:image:alt" content="${esc(event.title)}">

  <meta property="og:url" content="${esc(shareUrl)}">
  <meta property="og:locale" content="el_GR">

  <!-- X / Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(event.title)}">
  <meta
    name="twitter:description"
    content="${esc(event.description)}"
  >
  <meta name="twitter:image" content="${esc(imageUrl)}">

  <link rel="canonical" href="${esc(targetUrl)}">

  <!--
    Ο πραγματικός χρήστης μεταφέρεται
    στην κανονική εκδήλωση.
  -->
  <script>
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>

  <noscript>
    <meta
      http-equiv="refresh"
      content="0;url=${esc(targetUrl)}"
    >
  </noscript>
</head>

<body style="
  margin:0;
  background:#001b35;
  color:#f6d873;
  font-family:Arial,sans-serif;
  display:grid;
  place-items:center;
  min-height:100vh;
  text-align:center;
">
  <p>Μετάβαση στην εκδήλωση…</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "public, max-age=300"
    }
  });
}
