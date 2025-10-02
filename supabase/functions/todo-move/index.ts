import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { generateKeyBetween } from "../_shared/fractional-indexing.ts";
import { createErrorResponse, createSuccessResponse, corsHeaders } from "../_shared/response-utils.ts";
import { createAuthenticatedClient } from "../_shared/auth-utils.ts";

interface TodoMoveRequest {
  item_id: number
  target_position?: string
  before_item_id?: number
  after_item_id?: number
}

// Validation functions
function validateTodoMoveRequest(body: TodoMoveRequest): void {
  if (!body.item_id) {
    throw new Error("item_id is required");
  }

  if (!body.target_position && !body.before_item_id && !body.after_item_id) {
    throw new Error("Either target_position or before_item_id/after_item_id must be provided");
  }
}

// Business logic functions
async function getTodoItem(supabaseClient: any, itemId: number, userId: string) {
  const { data: item, error } = await supabaseClient
    .from('items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error || !item) {
    throw new Error("Item not found or unauthorized");
  }

  return item;
}

async function calculateNewPosition(
  supabaseClient: any,
  userId: string,
  targetPosition?: string,
  beforeItemId?: number,
  afterItemId?: number
): Promise<string> {
  if (targetPosition) {
    return targetPosition;
  }

  let beforePosition: string | null = null;
  let afterPosition: string | null = null;

  if (beforeItemId) {
    const { data: beforeItem } = await supabaseClient
      .from('items')
      .select('position')
      .eq('id', beforeItemId)
      .eq('user_id', userId)
      .single();

    if (beforeItem) {
      beforePosition = beforeItem.position;
    }
  }

  if (afterItemId) {
    const { data: afterItem } = await supabaseClient
      .from('items')
      .select('position')
      .eq('id', afterItemId)
      .eq('user_id', userId)
      .single();

    if (afterItem) {
      afterPosition = afterItem.position;
    }
  }

  return generateKeyBetween(afterPosition, beforePosition);
}

async function updateTodoItemPosition(supabaseClient: any, itemId: number, userId: string, newPosition: string) {
  const { data: updatedItem, error } = await supabaseClient
    .from('items')
    .update({
      position: newPosition,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error(error.message);
  }

  return updatedItem;
}

// Main handler function
async function handleTodoMove(req: Request): Promise<Response> {
  const body: TodoMoveRequest = await req.json();

  // Validate request
  validateTodoMoveRequest(body);

  // Create authenticated client
  const { supabaseClient, user } = await createAuthenticatedClient(req);

  // Get the item to be moved (for validation)
  await getTodoItem(supabaseClient, body.item_id, user.id);

  // Calculate new position
  const newPosition = await calculateNewPosition(
    supabaseClient,
    user.id,
    body.target_position,
    body.before_item_id,
    body.after_item_id
  );

  // Update item position
  const updatedItem = await updateTodoItemPosition(supabaseClient, body.item_id, user.id, newPosition);

  return createSuccessResponse(updatedItem);
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    return await handleTodoMove(req);
  } catch (error: any) {
    console.error('Function error:', error);

    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }

    if (error.message === "item_id is required") {
      return createErrorResponse(error.message, 400);
    }

    if (error.message === "Either target_position or before_item_id/after_item_id must be provided") {
      return createErrorResponse(error.message, 400);
    }

    if (error.message === "Item not found or unauthorized") {
      return createErrorResponse(error.message, 404);
    }

    return createErrorResponse("Internal server error", 500);
  }
});
