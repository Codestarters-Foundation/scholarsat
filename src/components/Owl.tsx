import { OWL_PARTS, OWL_VIEWBOX } from "./owl-paths";

export type OwlMood = "idle" | "still" | "loading" | "celebrate" | "sad";

/**
 * The ScholarSAT owl, inlined so each part can move.
 * - idle: gentle bob, blinks, tassel swings; wings flap when a parent `.group` is hovered
 * - loading: quicker bob with continuous flapping
 * - celebrate: hop + flap (correct answers, finished tests)
 * - sad: droop (wrong answers)
 * Motion is disabled under prefers-reduced-motion (see globals.css).
 */
export function Owl({ size = 36, mood = "idle", shy = false, className = "", title }: { size?: number; mood?: OwlMood; /** eyes closed (e.g. while typing a password) */ shy?: boolean; className?: string; title?: string }) {
  const [, , w, h] = OWL_VIEWBOX.split(" ").map(Number);
  return (
    <svg
      viewBox={OWL_VIEWBOX}
      width={(size * w) / h}
      height={size}
      className={`owl owl-${mood} ${shy ? "owl-shy" : ""} shrink-0 overflow-visible ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g className="owl-all">
        {/* White fill behind the face and belly cut-outs so the owl reads on any background */}
        <g fill="var(--owl-white, #fff)">
          <ellipse cx="1024" cy="900" rx="420" ry="400" />
          <ellipse cx="1024" cy="1330" rx="430" ry="380" />
        </g>
        {OWL_PARTS.map((part) => (
          <g key={part.name} className={`owl-${part.name}`}>
            {part.paths.map((p, i) => (
              <path key={i} d={p.d} fill={p.fill} transform={p.transform} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
