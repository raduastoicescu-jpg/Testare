module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ valid: false });

  const code = (req.body && req.body.code || '').trim().toUpperCase();
  if (!code) return res.status(200).json({ valid: false });

  // Check master password (env var only, never in source)
  const master = process.env.MASTER_GUEST_PASSWORD;
  if (master && code === master.trim().toUpperCase()) return res.status(200).json({ valid: true });

  // Check active reservations from GitHub
  const token = process.env.GITHUB_TOKEN;
  const owner = 'raduastoicescu-jpg';
  const repo  = 'Testare';

  try {
    const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/config.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'LovelyCondoAdmin',
      },
    });
    if (!apiRes.ok) return res.status(200).json({ valid: false });

    const config = await apiRes.json();
    let reservations = config.reservations ||
      (config.guestCode ? [{ guestCode: config.guestCode, checkoutDate: config.checkoutDate }] : []);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const valid = reservations.some(r => {
      if (!r.guestCode || r.guestCode.toUpperCase() !== code) return false;
      return r.checkoutDate && new Date(r.checkoutDate + 'T00:00:00') >= today;
    });

    return res.status(200).json({ valid });
  } catch {
    return res.status(200).json({ valid: false });
  }
};
