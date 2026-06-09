exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { action, guestCode, checkoutDate } = body;
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

    // Handle old single-reservation format
    let reservations = currentConfig.reservations ||
      (currentConfig.guestCode ? [{ guestCode: currentConfig.guestCode, checkoutDate: currentConfig.checkoutDate }] : []);

    // Auto-clean expired reservations
    const today = new Date(); today.setHours(0, 0, 0, 0);
    reservations = reservations.filter(r => r.checkoutDate && new Date(r.checkoutDate + 'T00:00:00') >= today);

    if (action === 'add') {
      reservations = reservations.filter(r => r.guestCode !== guestCode);
      reservations.push({ guestCode, checkoutDate });
    } else if (action === 'remove') {
      reservations = reservations.filter(r => r.guestCode !== guestCode);
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

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
