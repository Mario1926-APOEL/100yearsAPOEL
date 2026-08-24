export async function onRequest(context) {
  const id = String(context.params.id || "");

  const site = "https://apoel100years.org";

  const events = {
    "4": {
      title: "Graffiti Day & Μουσική Βραδιά",
      date: "Τρίτη 01.09.26",
      time: "18:00",
      venue: "ΠΑΝ.ΣΥ.ΦΙ. ΑΠΟΕΛ",
      image: "IMG-99e8a16c72aa7cde08be3d74dacfcbbd-V.jpg"
    }
  };

  const event = events[id];

  if (!event) {
    return Response.redirect(site, 302);
  }

  const params = new URLSearchParams({
    event: id,
    title: event.title,
    date: event.date,
    time: event.time,
    venue: event.venue,
    image: event.image
  });

  return Response.redirect(
    `${site}/share?${params.toString()}`,
    302
  );
}
