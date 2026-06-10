module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body;
  if (!body) return res.status(400).json({ error: 'Invalid JSON' });

  const guestCode = body.guestCode;
  const checkoutDate = body.checkoutDate;
  const action = body.action || (guestCode ? 'add' : 'clear');
  const token = process.env.GITHUB_TOKEN;
  const owner = 'raduastoicescu-jpg';
  const repo = 'Testare';
  const filePath = 'config.json';

  try {
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'LovelyCondoAdmin',
      },
    });

    if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);
    const { sha, content: encodedContent } = await getRes.json();
    const currentConfig = JSON.parse(Buffer.from(encodedContent.replace(/\n/g, ''), 'base64').toString());

    let reservations = currentConfig.reservations ||
      (currentConfig.guestCode ? [{ guestCode: currentConfig.guestCode, checkoutDate: currentConfig.checkoutDate }] : []);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    reservations = reservations.filter(r => r.checkoutDate && new Date(r.checkoutDate + 'T00:00:00') >= today);

    if (action === 'add' && guestCode) {
      reservations = reservations.filter(r => r.guestCode !== guestCode);
      reservations.push({ guestCode, checkoutDate });
    } else if (action === 'remove' && guestCode) {
      reservations = reservations.filter(r => r.guestCode !== guestCode);
    } else if (action === 'clear') {
      reservations = [];
    }

    const newConfig = { reservations };
    const content = Buffer.from(JSON.stringify(newConfig, null, 2)).toString('base64');
    const commitMsg = action === 'add'
      ? `Activate reservation ${guestCode} until ${checkoutDate}`
      : action === 'remove' ? `Remove reservation ${guestCode}` : 'Update reservations';

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'LovelyCondoAdmin',
      },
      body: JSON.stringify({ message: commitMsg, content, sha }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(`GitHub PUT failed: ${putRes.status} — ${JSON.stringify(err)}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
