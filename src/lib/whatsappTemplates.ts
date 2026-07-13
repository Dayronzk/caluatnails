// Shared helpers for working with Meta WhatsApp message templates.
// Used by the WhatsApp 1:1 chat (TemplateModal) and the marketing campaign wizard.

export interface TemplateMeta {
  name: string;
  language: string;
  category: string;
  body_text: string;
  header_text: string | null;
  header_format: string | null;
  footer_text: string | null;
  variable_count: number;
}

export type VarKind = "name" | "date" | "time" | "professional" | "service" | "points" | "unknown";

// Infer what each {{n}} variable represents by looking at the surrounding
// words in the template body.
export function inferVariableKinds(bodyText: string, count: number): VarKind[] {
  const kinds: VarKind[] = Array(count).fill("unknown");
  for (let i = 1; i <= count; i++) {
    const placeholder = `{{${i}}}`;
    const idx = bodyText.indexOf(placeholder);
    if (idx < 0) continue;
    const before = bodyText.slice(Math.max(0, idx - 40), idx).toLowerCase();
    const lineStart = bodyText.lastIndexOf("\n", idx);
    const line = bodyText.slice(lineStart < 0 ? 0 : lineStart, idx).toLowerCase();

    if (/(hola|estimad[ao]|hi |hello)\s*[!,]?\s*$/i.test(before)) {
      kinds[i - 1] = "name";
    } else if (/\bcon\s+$/i.test(before) || /profesional/.test(line)) {
      kinds[i - 1] = "professional";
    } else if (/\ba las\s+$/i.test(before) || /\bhora\b/.test(line) || /minutos?\s*\(\s*$/i.test(before)) {
      kinds[i - 1] = "time";
    } else if (/\bel\s+$/i.test(before) || /\bfecha\b/.test(line) || /\bd[ií]a\b/.test(before) || /ma[ñn]ana\s*$/i.test(before)) {
      kinds[i - 1] = "date";
    } else if (/servicio/.test(line)) {
      kinds[i - 1] = "service";
    } else if (/puntos/.test(line) || /points/.test(line)) {
      kinds[i - 1] = "points";
    } else {
      kinds[i - 1] = (["name", "date", "time", "professional"][i - 1] as VarKind) ?? "unknown";
    }
  }
  return kinds;
}

export function formatBookingDate(iso: string): string {
  // "2026-05-28" → "jueves 28 de mayo"
  const d = new Date(`${iso}T00:00:00`);
  const dayName = d.toLocaleDateString("es-ES", { weekday: "long" });
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString("es-ES", { month: "long" });
  return `${dayName} ${dayNum} de ${monthName}`;
}

export function renderPreview(bodyText: string, vars: string[]): string {
  return bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const idx = parseInt(n, 10) - 1;
    const val = vars[idx];
    return val && val.trim() ? val : `{{${n}}}`;
  });
}
