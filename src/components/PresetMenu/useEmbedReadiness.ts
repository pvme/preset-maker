import { useCallback, useEffect, useRef, useState } from "react";
import { getEmbedStatus } from "../../api/embed-status";
import { buildEmbedLink } from "../../utility/embed-link";
import type { InventoryLayout } from "../../hooks/useInventoryLayout";

interface Options {
  id?: string;
  layout: InventoryLayout;
  mode: "local" | "cloud";
  isDirty: boolean | null;
  busy: boolean;
  contentKey: string;
}
type Result = { key: string; state: "pending" | "ready" | "error"; revision?: string };

export function useEmbedReadiness({ id, layout, mode, isDirty, busy, contentKey }: Options) {
  const enabled = Boolean(id && mode === "cloud" && isDirty === false && !busy);
  const key = JSON.stringify([id, layout, contentKey, enabled]);
  const currentKey = useRef(key);
  currentKey.current = key;
  const [result, setResult] = useState<Result>();
  const [retryCount, setRetryCount] = useState(0);
  const retry = useCallback(() => {
    setResult({ key: currentKey.current, state: "pending" });
    setRetryCount(count => count + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !id) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const started = Date.now();
    const check = async () => {
      if (stopped || document.hidden) return;
      const request = new AbortController();
      controller = request;
      let ready = false;
      try {
        const status = await getEmbedStatus(id, layout, request.signal);
        if (stopped || request.signal.aborted || currentKey.current !== key) return;
        ready = status.state === "ready";
        setResult({ key, ...status });
      } catch {
        if (stopped || request.signal.aborted || currentKey.current !== key) return;
        setResult({ key, state: "error" });
      } finally {
        if (!stopped && !request.signal.aborted && controller === request && !document.hidden) {
          timer = setTimeout(check, ready || Date.now() - started >= 60000 ? 30000 : 5000);
        }
      }
    };
    const onVisibility = () => {
      clearTimeout(timer);
      controller?.abort();
      if (!document.hidden) void check();
    };
    setResult({ key, state: "pending" });
    void check();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, id, layout, key, retryCount]);

  const state = result?.key === key ? result.state : "pending";
  const label = mode === "local" || !id ? "Upload to cloud first"
    : busy ? "Preparing embed…"
    : isDirty ? "Save changes first"
    : state === "error" ? "Embed unavailable — retry"
    : state === "ready" ? "Copy embed link" : "Preparing embed…";

  const copyUrl = useCallback(async () => {
    if (!enabled || !id || state !== "ready") return;
    try {
      const status = await getEmbedStatus(id, layout);
      if (currentKey.current !== key) return;
      setResult({ key, ...status });
      if (status.state === "ready") return buildEmbedLink(id, layout, undefined, status.revision);
    } catch {
      if (currentKey.current === key) setResult({ key, state: "error" });
    }
    return;
  }, [enabled, id, layout, key, state]);

  return { label, ready: enabled && state === "ready", canRetry: enabled && state === "error", retry, copyUrl };
}
