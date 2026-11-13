import katex from "katex";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Renders question text: escapes HTML, renders \( ... \) as KaTeX, keeps <br>, turns newlines into line breaks
 * and "______" into an accessible blank.
 */
export function rich(text: string): string {
  const parts = text.split(/(\\\([\s\S]*?\\\))/g);
  return parts
    .map((p) => {
      if (p.startsWith("\\(") && p.endsWith("\\)")) {
        try {
          return katex.renderToString(p.slice(2, -2), { throwOnError: false, output: "html" });
        } catch {
          return esc(p);
        }
      }
      return esc(p)
        .replace(/&lt;br&gt;/g, "<br/>")
        .replace(/\n/g, "<br/>")
        .replace(/_{4,}/g, '<span class="blank" aria-label="blank"></span>');
    })
    .join("");
}
