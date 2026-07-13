// Gemini fallback for the WhatsApp agent.
// Used when Claude (Anthropic) fails (no credits, rate limit, API key invalid).
// Same tool calling capabilities, different API format.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface ClaudeContent {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | ClaudeContent[];
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface GeminiTurnResult {
  text: string;
  toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  stopReason: "tool_use" | "stop" | "max_tokens" | "other";
  usage: { input_tokens: number; output_tokens: number };
}

// Strip JSON Schema features Gemini doesn't accept (oneOf, anyOf, $ref, default…).
function sanitizeSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(sanitizeSchema);
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    // Gemini accepts: type, properties, required, items, enum, description, format, nullable
    if (k === "additionalProperties" || k === "$schema" || k === "default" || k === "examples") continue;
    if (k === "oneOf" || k === "anyOf" || k === "allOf") {
      // Take first subschema as a degraded representation
      const sub = (v as any[])[0];
      if (sub && typeof sub === "object") Object.assign(out, sanitizeSchema(sub));
      continue;
    }
    out[k] = sanitizeSchema(v);
  }
  return out;
}

function toGeminiTools(anthropicTools: AnthropicTool[]) {
  return [{
    functionDeclarations: anthropicTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: sanitizeSchema(t.input_schema),
    })),
  }];
}

// Map tool_use_id → tool name (Gemini needs the name for functionResponse, Anthropic only stores id)
function buildToolNameMap(messages: ClaudeMessage[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      for (const c of m.content) {
        if (c.type === "tool_use" && c.id && c.name) {
          map.set(c.id, c.name);
        }
      }
    }
  }
  return map;
}

function toGeminiContents(messages: ClaudeMessage[]) {
  const toolNameMap = buildToolNameMap(messages);
  const contents: any[] = [];

  for (const m of messages) {
    const geminiRole = m.role === "user" ? "user" : "model";

    if (typeof m.content === "string") {
      if (m.content.trim()) {
        contents.push({ role: geminiRole, parts: [{ text: m.content }] });
      }
      continue;
    }

    const parts: any[] = [];
    for (const c of m.content) {
      if (c.type === "text" && c.text && c.text.trim()) {
        parts.push({ text: c.text });
      } else if (c.type === "tool_use") {
        parts.push({
          functionCall: {
            name: c.name || "unknown",
            args: c.input ?? {},
          },
        });
      } else if (c.type === "tool_result") {
        const name = c.tool_use_id ? (toolNameMap.get(c.tool_use_id) || "unknown") : "unknown";
        // Gemini expects functionResponse.response to be a STRUCT (plain object).
        // Arrays, primitives and null are rejected → must be wrapped.
        let responseObj: Record<string, unknown>;
        try {
          const parsed = c.content ? JSON.parse(c.content) : {};
          if (Array.isArray(parsed)) {
            // Wrap arrays so Gemini's protobuf schema accepts it.
            responseObj = { items: parsed };
          } else if (typeof parsed === "object" && parsed !== null) {
            responseObj = parsed as Record<string, unknown>;
          } else {
            // primitives (string, number, bool, null)
            responseObj = { result: parsed };
          }
        } catch {
          responseObj = { result: c.content ?? "" };
        }
        parts.push({
          functionResponse: {
            name,
            response: responseObj,
          },
        });
      }
    }

    if (parts.length > 0) {
      contents.push({ role: geminiRole, parts });
    }
  }

  return contents;
}

/**
 * Run one Gemini turn with the same tool-calling contract as the Claude path.
 * Throws on hard API failure so the caller can decide how to surface to the user.
 */
export async function callGeminiTurn(
  systemPrompt: string,
  messages: ClaudeMessage[],
  toolSchemas: AnthropicTool[],
  apiKey: string,
): Promise<GeminiTurnResult> {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  };
  // Gemini rejects an empty functionDeclarations array, so only attach tools
  // when there actually are some (the draft/suggestion path passes none).
  if (toolSchemas.length > 0) {
    body.tools = toGeminiTools(toolSchemas);
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error(`Gemini: no candidates in response. ${JSON.stringify(data).slice(0, 300)}`);
  }

  const parts = candidate.content?.parts ?? [];
  const textParts: string[] = [];
  const toolCalls: GeminiTurnResult["toolCalls"] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.text) textParts.push(p.text);
    if (p.functionCall) {
      // Synthesise a stable id (Anthropic uses ids, Gemini doesn't)
      toolCalls.push({
        id: `gemini_tc_${Date.now()}_${i}`,
        name: p.functionCall.name,
        input: p.functionCall.args ?? {},
      });
    }
  }

  const finishReason = candidate.finishReason;
  const stopReason =
    toolCalls.length > 0 ? "tool_use" :
    finishReason === "MAX_TOKENS" ? "max_tokens" :
    finishReason === "STOP" ? "stop" :
    "other";

  const usage = data.usageMetadata ?? {};
  return {
    text: textParts.join("\n").trim(),
    toolCalls,
    stopReason,
    usage: {
      input_tokens: usage.promptTokenCount ?? 0,
      output_tokens: usage.candidatesTokenCount ?? 0,
    },
  };
}

export function isClaudeRecoverableError(errText: string, status: number): boolean {
  // These are errors we can recover from by falling back to Gemini.
  return (
    status === 401 || // bad key
    status === 429 || // rate limit
    status >= 500 ||  // server error
    /credit\s*balance|insufficient_quota|billing|rate.?limit|overloaded/i.test(errText)
  );
}
