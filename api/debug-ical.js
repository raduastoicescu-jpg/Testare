module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const icalUrl = process.env.AIRBNB_ICAL_URL;
  if (!icalUrl) return res.status(500).json({ error: 'AIRBNB_ICAL_URL not set' });

  try {
    const response = await fetch(icalUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const text = await response.text();

    // Unfold iCal lines
    const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');

    // Split into VEVENT blocks
    const vevents = unfolded.split('BEGIN:VEVENT').slice(1).map(block => {
      const lines = block.split(/\r?\n/);
      const obj = {};
      for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.slice(0, idx).split(';')[0].trim();
        const val = line.slice(idx + 1).trim();
        obj[key] = val;
      }
      return obj;
    });

    return res.status(200).json({ count: vevents.length, events: vevents });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
