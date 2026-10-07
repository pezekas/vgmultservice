import { createClient } from "@/lib/supabase/server";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Envie os dados do pedido em JSON." }, { status: 415 });
  }

  const body = await request.text();
  if (body.length > 80_000) return Response.json({ error: "O pedido excede o tamanho permitido." }, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Os dados do pedido estão inválidos." }, { status: 400 });
  }

  if (!isObject(payload) || !isObject(payload.customer) || !Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 50) {
    return Response.json({ error: "Informe os dados do cliente e os itens do pedido." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_public_order", { p_payload: payload });
    if (error) {
      console.error("[orders] Falha ao persistir ordem de serviço:", error.code, error.message);
      return Response.json({ error: "Não foi possível registrar a ordem de serviço. Verifique se a migração de ordens foi aplicada e tente novamente." }, { status: 503 });
    }
    if (!isObject(data) || typeof data.order_number !== "string" || typeof data.id !== "string") {
      console.error("[orders] A resposta do banco não contém a identificação da ordem.");
      return Response.json({ error: "A ordem foi recebida, mas não foi possível obter seu número. Tente novamente." }, { status: 502 });
    }

    return Response.json({ orderNumber: data.order_number, orderId: data.id }, { status: 201 });
  } catch (error) {
    console.error("[orders] Serviço de ordens indisponível:", error);
    return Response.json({ error: "Não foi possível conectar ao banco para registrar a ordem." }, { status: 503 });
  }
}
