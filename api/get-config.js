module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const token = process.env.GITHUB_TOKEN;
  const owner = 'raduastoicescu-jpg';
  const repo = 'Testare';

  try {
    const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/config.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'LovelyCondoAdmin',
      },
    });

    if (!apiRes.ok) throw new Error(`GitHub GET failed: ${apiRes.status}`);
    const config = await apiRes.json();

    let reservations = config.reservations ||
      (config.guestCode ? [{ guestCode: config.guestCode, checkoutDate: config.checkoutDate }] : []);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    reservations = reservations.filter(r => r.checkoutDate && new Date(r.checkoutDate + 'T00:00:00') >= today);

    return res.status(200).json({ reservations });
  } catch {
    return res.status(200).json({ reservations: [] });
  }
};
