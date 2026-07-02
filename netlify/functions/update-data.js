const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const authHeader = event.headers['x-admin-password'] || '';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aqua2026';
  if (authHeader !== ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { sede, data, mode, meta } = body;

    console.log('update-data called:', { mode, sede, dataLength: data?.length });
    console.log('ENV check - SITE_ID:', process.env.NETLIFY_SITE_ID ? 'SET' : 'MISSING');
    console.log('ENV check - TOKEN:', process.env.NETLIFY_TOKEN ? 'SET' : 'MISSING');

    const store = getStore({
      name: 'aquaanalytics',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN
    });

    if (mode === 'meta') {
      await store.setJSON('_meta', meta);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const key = 'sede_' + sede;
    let existing = [];
    try {
      existing = await store.get(key, { type: 'json' }) || [];
    } catch(e) {
      existing = [];
    }

    if (mode === 'full') {
      const byId = {};
      existing.forEach(r => { byId[r.i] = r; });
      data.forEach(r => { byId[r.i] = r; });
      const merged = Object.values(byId);
      console.log('Saving', merged.length, 'records for', sede);
      await store.setJSON(key, merged);
      console.log('Saved OK for', sede);
    } else if (mode === 'partial') {
      const byId = {};
      existing.forEach(r => { byId[r.i] = r; });
      data.forEach(upd => {
        if (byId[upd.i]) byId[upd.i] = { ...byId[upd.i], e: upd.e, b: upd.b, n: upd.n };
      });
      await store.setJSON(key, Object.values(byId));
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, records: data.length }) };
  } catch (err) {
    console.error('update-data ERROR:', err.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
