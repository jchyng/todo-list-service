import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { generateKeyBetween } from "../_shared/fractional-indexing.ts";
import {
  corsHeaders,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/response-utils.ts";
import { createAuthenticatedClient } from "../_shared/auth-utils.ts";

interface TodoItemRequest {
  list_id: number;
  title: string;
}

function validateTodoRequest(body: TodoItemRequest): void {
  if (!body.list_id || !body.title) {
    throw new Error("list_id and title are required");
  }
}

async function calculateNewPosition(
  supabaseClient: any,
  userId: string,
  listId: number,
): Promise<string> {
  const { data: lastItem } = await supabaseClient
    .from("items")
    .select("position")
    .eq("user_id", userId)
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return generateKeyBetween(lastItem?.position || null, null);
}

async function insertTodoItem(
  supabaseClient: any,
  user: any,
  body: TodoItemRequest,
  position: string,
) {
  const { data: item, error } = await supabaseClient
    .from("items")
    .insert({
      user_id: user.id,
      list_id: body.list_id,
      title: body.title,
      position: position,
      is_completed: false,
      is_important: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Database error:", error);
    throw new Error(error.message);
  }

  return item;
}

// Main handler function
async function handleTodoAdd(req: Request): Promise<Response> {
  const body: TodoItemRequest = await req.json();

  validateTodoRequest(body);

  const { supabaseClient, user } = await createAuthenticatedClient(req);

  const newPosition = await calculateNewPosition(
    supabaseClient,
    user.id,
    body.list_id,
  );

  const item = await insertTodoItem(supabaseClient, user, body, newPosition);

  return createSuccessResponse(item);
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return await handleTodoAdd(req);
  } catch (error: any) {
    console.error("Function error:", error);

    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }

    if (error.message === "list_id and title are required") {
      return createErrorResponse(error.message, 400);
    }

    return createErrorResponse("Internal server error", 500);
  }
});
