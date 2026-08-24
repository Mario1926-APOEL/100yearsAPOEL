export async function onRequest(context) {
  const url = new URL(context.request.url);

  const event = url.searchParams.get("event") || "";
  const title = url.searchParams.get("title") || "ΑΠΟΕΛ 100 ΧΡΟΝΙΑ";
  const date = url.searchParams.get("date") || "";
  const time = url.searchParams.get("time") || "";
  const venue = url.searchParams.get("venue") || "";
  const image = url.searchParams.get("image") || "emblem_reveal.jpg";

  const site = "https://apoel100years.org";

  // Αν το image έρθει σαν απλό filename, το κάνουμε πλήρες URL
  const imageUrl = image.startsWith("http")
    ? image
    : `${site}/${image.replace(/^\/+/, "")}`;

  // Εκεί θα καταλήγει ο χρήστης όταν πατήσει το preview
  const targetUrl = event
    ? `${site}/?event=${encodeURIComponent(event)}`
    : site;

  const descriptionParts = [];

  if (date) descriptionParts.push(`📅 ${date}`);
  if (time) descriptionParts.push(`🕕 ${time}`);
  if (venue) descriptionParts.push(`📍 ${venue}`);

  const description =
    descriptionParts.join(" · ") ||
    "100 Χρόνια ΑΠΟΕΛ · 1926–2026";

  const esc = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const html = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${esc(title)} | ΑΠΟΕΛ 100 ΧΡΟΝΙΑ</title>

  <meta name="description" content="${esc(description)}">

  <!-- Open Graph: WhatsApp / Viber / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ΑΠΟΕΛ 100 ΧΡΟΝΙΑ">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:image:secure_url" content="${esc(imageUrl)}">
  <meta property="og:image:alt" content="${esc(title)}">
  <meta property="og:url" content="${esc(url.href)}">
  <meta property="og:locale" content="el_GR">

  <!-- X / Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">

  <link rel="canonical" href="${esc(targetUrl)}">

  <script>
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>

  <noscript>
    <meta http-equiv="refresh" content="0;url=${esc(targetUrl)}">
  </noscript>
</head>

<body style="
  margin:0;
  background:#001b35;
  color:#f6d873;
  font-family:Arial,sans-serif;
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:100vh;
  text-align:center;
">
  <div>
    <p>ΑΠΟΕΛ · 100 ΧΡΟΝΙΑ</p>
    <p>
      <a href="${esc(targetUrl)}" style="color:#f6d873;">
        Μετάβαση στην εκδήλωση
      </a>
    </p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "public, max-age=300"
    }
  });
}
