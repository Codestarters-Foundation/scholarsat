import { rich } from "@/lib/render";

export function Rich({ text, className = "", as: Tag = "div" }: { text: string; className?: string; as?: "div" | "span" | "p" }) {
  return <Tag className={`qtext ${className}`} dangerouslySetInnerHTML={{ __html: rich(text) }} />;
}
