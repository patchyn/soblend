addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const source = url.searchParams.get('by');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // ⚠️ Clave API incluida directamente para uso privado (NO para producción)
  const serpApiKey = "f6fa451fbe5750f932c840447910e3b1d7ff727391c5b9807493f6b17e43fb20";

  if (!query) {
    return new Response(JSON.stringify({
      error: "Parámetro 'q' (texto de búsqueda) es requerido.",
      example_url: "https://<tu-worker>.workers.dev/?q=ejemplo_de_busqueda&by=soblend--utf-5"
    }), { status: 400, headers });
  }

  if (source !== 'soblend--utf-5') {
    return new Response(JSON.stringify({
      error: "Parámetro 'by' inválido. Debe ser 'soblend--utf-5'.",
      example_url: "https://<tu-worker>.workers.dev/?q=ejemplo_de_busqueda&by=soblend--utf-5"
    }), { status: 400, headers });
  }

  try {
    const serpApiUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
    const serpApiResponse = await fetch(serpApiUrl);

    if (!serpApiResponse.ok) {
      const errorText = await serpApiResponse.text();
      throw new Error(`Error de la API de SerpApi: ${serpApiResponse.status} - ${errorText}`);
    }

    const data = await serpApiResponse.json();

    const results = data.organic_results?.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    })) || [];

    return new Response(JSON.stringify({
      query,
      source,
      message: `Resultados de búsqueda para "${query}"`,
      results,
      search_information: {
        total_results: data.search_information?.total_results ?? 0,
        time_taken: data.search_information?.time_taken ?? 0
      }
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      error: "Ocurrió un error al procesar tu búsqueda con SerpApi.",
      details: error.message
    }), { status: 500, headers });
  }
                                                       }
