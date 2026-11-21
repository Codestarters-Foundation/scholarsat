import { useMemo, useSyncExternalStore } from "react";
import { parseAiConfig, readAiConfigRaw, subscribeAiConfig, type AiConfig } from "./ai";

/**
 * The saved AI settings from this browser.
 * `undefined` until the browser has been read (so server and first client render match), then the config or null.
 */
export function useAiConfig(): AiConfig | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(subscribeAiConfig, readAiConfigRaw, () => undefined);
  return useMemo(() => (raw === undefined ? undefined : parseAiConfig(raw)), [raw]);
}
