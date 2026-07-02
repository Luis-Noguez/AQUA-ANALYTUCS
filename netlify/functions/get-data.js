const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const sede = event.queryStringParameters?.sede || '_meta';
  try {
    const store = getStore('aquaanalytics');
    const key = sede === '_meta' ? '_meta' : 'sede_' + sede;
    const data = await store.get(key, { type: 'json' });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify(data || (sede === '_meta' ? {} : []))
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sede === '_meta' ? {} : [])
    };
  }
};
