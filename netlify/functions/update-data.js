// Netlify Function: recibe el Excel procesado desde el admin,
// guarda los datos en Netlify Blobs (storage persistente de Netlify)
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Verificar contraseña de admin
  const authHeader = event.headers['x-admin-password'] || '';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aqua2026';
  if (authHeader !== ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { sede, data, mode, meta } = body;

    const store = getStore({ name: 'aquaanalytics', consistency: 'strong' });

    if (mode === 'meta') {
      await store.setJSON('_meta', meta);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // Guardar por sede
    const key = 'sede_' + sede;
    let existing = [];
    try {
      existing = await store.get(key, { type: 'json' }) || [];
    } catch(e) { existing = []; }

    if (mode === 'full') {
      // Fusión por ID
      const byId = {};
      existing.forEach(r => { byId[r.i] = r; });
      data.forEach(r => { byId[r.i] = r; });
      await store.setJSON(key, Object.values(byId));
    } else if (mode === 'partial') {
      // Solo actualizar estatus/fecha_baja
      const byId = {};
      existing.forEach(r => { byId[r.i] = r; });
      data.forEach(upd => {
        if (byId[upd.i]) {
          byId[upd.i] = { ...byId[upd.i], e: upd.e, b: upd.b, n: upd.n };
        }
      });
      await store.setJSON(key, Object.values(byId));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, records: data.length })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
