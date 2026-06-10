module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');

  const icalUrl = process.env.AIRBNB_ICAL_URL;
  if (!icalUrl) return res.status(500).json({ error: 'AIRBNB_ICAL_URL not configured' });

  try {
    const response = await fetch(icalUrl);
    if (!response.ok) throw new Error(`iCal fetch failed: ${response.status}`);
    const text = await response.text();
    return res.status(200).json({ blockedRanges: parseBlocked(text) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function parseDate(d) {
  if (!d) return null;
  const s = d.replace(/\D/g, '').slice(0, 8);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function parseBlocked(text) {
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const results = [];

  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const get = k => { const m = block.match(new RegExp(k + '[^:\\r\\n]*:([^\\r\\n]+)')); return m ? m[1].trim() : null; };
    const checkin = parseDate(get('DTSTART'));
    const checkout = parseDate(get('DTEND'));
    if (!checkin || !checkout) continue;
    if (new Date(checkout + 'T00:00:00') < today) continue;
    results.push({ checkin, checkout });
  }

  return results;
}
