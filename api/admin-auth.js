module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ valid: false });

  const password = (req.body && req.body.password || '').trim();
  const adminPwd = (process.env.ADMIN_PASSWORD || '').trim();

  if (!password || !adminPwd) return res.status(200).json({ valid: false });
  return res.status(200).json({ valid: password === adminPwd });
};
