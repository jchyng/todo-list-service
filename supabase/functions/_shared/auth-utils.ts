import { createClient } from "jsr:@supabase/supabase-js@2";

// Authentication and client utility functions
export async function createAuthenticatedClient(req: Request) {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
  );

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { supabaseClient, user };
}