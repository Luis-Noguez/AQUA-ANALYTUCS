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
    const { sede, data, mode, meta, batch, isFirst } = body;

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

    if (mode === 'full') {
      // Batch mode: isFirst=true clears existing, subsequent batches append
      let existing = [];
      if (!isFirst) {
        try {
          existing = await store.get(key, { type: 'json' }) || [];
        } catch(e) { existing = []; }
      }
      const byId = {};
      existing.forEach(r => { byId[r.i] = r; });
      data.forEach(r => { byId[r.i] = r; });
      const merged = Object.values(byId);
      await store.setJSON(key, merged);
      return { statusCode: 200, body: JSON.stringify({ ok: true, records: merged.length }) };

    } else if (mode === 'partial') {
      let existing = [];
      try {
        existing = await store.get(key, { type: 'json' }) || [];
      } catch(e) { existing = []; }
      const byId = {};
      existing.forEach(r => { byId[r.i] = r; });
      data.forEach(upd => {
        if (byId[upd.i]) byId[upd.i] = { ...byId[upd.i], e: upd.e, b: upd.b, n: upd.n };
      });
      await store.setJSON(key, Object.values(byId));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown mode' }) };

  } catch (err) {
    console.error('update-data ERROR:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
