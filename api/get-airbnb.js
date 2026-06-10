module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const icalUrl = process.env.AIRBNB_ICAL_URL;
  if (!icalUrl) return res.status(500).json({ error: 'AIRBNB_ICAL_URL not configured' });

  try {
    const response = await fetch(icalUrl);
    if (!response.ok) throw new Error(`iCal fetch failed: ${response.status}`);
    const text = await response.text();
    return res.status(200).json({ reservations: parseReserved(text) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function parseDate(d) {
  if (!d) return null;
  const s = d.replace(/\D/g, '').slice(0, 8);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function parseReserved(text) {
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const results = [];

  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const get = k => { const m = block.match(new RegExp(k + '[^:\\r\\n]*:([^\\r\\n]+)')); return m ? m[1].trim() : null; };

    const summary = get('SUMMARY') || '';
    if (!summary.includes('Reserved')) continue;

    const checkoutDate = parseDate(get('DTEND'));
    if (!checkoutDate || new Date(checkoutDate + 'T00:00:00') < today) continue;

    const desc = get('DESCRIPTION') || '';
    const codeMatch = desc.match(/reservations\/details\/([A-Z0-9]+)/);
    if (!codeMatch) continue;

    results.push({ guestCode: codeMatch[1], checkinDate: parseDate(get('DTSTART')), checkoutDate });
  }

  return results;
}
