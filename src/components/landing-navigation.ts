export const questionBankSession = "/practice/play?section=rw&limit=5";

export function quietPlayback(element: Element, preference = matchMedia("(prefers-reduced-motion: reduce)")) {
  return !element.closest("[data-full-motion]") && (preference.matches || document.documentElement.classList.contains("reduce-motion"));
}

export function turnTo(id: string, event: {preventDefault: () => void}) {
  const stop = document.getElementById(id);
  if (!stop) return;
  event.preventDefault();
  if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
  const reduced = quietPlayback(stop);
  stop.scrollIntoView({behavior: reduced ? "instant" : "smooth"});
}
