const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Response utility functions
export function createErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

export function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export { corsHeaders };