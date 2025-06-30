export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const source = url.searchParams.get('by');

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Manejar preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Clave de SerpAPI (solo para pruebas privadas)
    const serpApiKey = "f6fa451fbe5750f932c840447910e3b1d7ff727391c5b9807493f6b17e43fb20";

    if (!query) {
      return new Response(JSON.stringify({
        error: "Parámetro 'q' (texto de búsqueda) es requerido.",
        example_url: "https://soblendr-api.nekopulsex.workers.dev/?q=ejemplo&by=soblend--utf-5"
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (source !== 'soblend--utf-5') {
      return new Response(JSON.stringify({
        error: "Parámetro 'by' inválido. Debe ser 'soblend--utf-5'."
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    try {
      const serpApiUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
      const serpApiResponse = await fetch(serpApiUrl);

      if (!serpApiResponse.ok) {
        const errorText = await serpApiResponse.text();
        throw new Error(`Error de SerpApi: ${serpApiResponse.status} - ${errorText}`);
      }

      const data = await serpApiResponse.json();

      const results = (data.organic_results || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet
      }));

      return new Response(JSON.stringify({
        query,
        source,
        message: `Resultados de búsqueda para "${query}"`,
        results,
        search_information: {
          total_results: data.search_information?.total_results || 0,
          time_taken: data.search_information?.time_taken || 0
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error: any) {
      return new Response(JSON.stringify({
        error: "Ocurrió un error al procesar tu búsqueda con SerpApi.",
        details: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
