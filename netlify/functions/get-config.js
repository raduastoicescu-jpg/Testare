exports.handler = async () => {
  const token = process.env.GITHUB_TOKEN;
  const owner = 'raduastoicescu-jpg';
  const repo = 'Testare';

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/config.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'LovelyCondoAdmin',
      },
    });

    if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
    const config = await res.json();

    // Handle old single-reservation format
    let reservations = config.reservations ||
      (config.guestCode ? [{ guestCode: config.guestCode, checkoutDate: config.checkoutDate }] : []);

    // Return only non-expired reservations
    const today = new Date(); today.setHours(0, 0, 0, 0);
    reservations = reservations.filter(r => r.checkoutDate && new Date(r.checkoutDate + 'T00:00:00') >= today);

    return { statusCode: 200, headers, body: JSON.stringify({ reservations }) };
  } catch {
    return { statusCode: 200, headers, body: JSON.stringify({ reservations: [] }) };
  }
};
