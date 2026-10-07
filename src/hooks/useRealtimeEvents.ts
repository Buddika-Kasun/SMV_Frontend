import { useEffect, useRef } from "react";
import { RealtimeEvent } from "../types/realtime.types";

interface UseRealtimeEventsOptions {
  token: string | null;
  onEvent: (event: RealtimeEvent) => void;
  /** Reconnect if no message arrives within this window (ms). */
  staleAfterMs?: number;
  /** How often to check for staleness (ms). */
  checkIntervalMs?: number;
}

export const useRealtimeEvents = ({
  token,
  onEvent,
  staleAfterMs = 45_000,
  checkIntervalMs = 10_000,
}: UseRealtimeEventsOptions) => {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const sourceRef = useRef<EventSource | null>(null);
  const lastMessageAtRef = useRef<number>(Date.now());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      cleanup();
      return;
    }

    disposedRef.current = false;
    connect();

    // --- Health check: reconnect if silent for too long ---
    const healthTimer = window.setInterval(() => {
      if (disposedRef.current) return;
      const silentMs = Date.now() - lastMessageAtRef.current;
      if (silentMs > staleAfterMs) {
        console.warn(`[SSE] stale for ${silentMs}ms — reconnecting`);
        hardReconnect();
      }
    }, checkIntervalMs);

    // --- Reconnect when the tab becomes visible again ---
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const state = sourceRef.current?.readyState;
      if (state !== EventSource.OPEN) {
        console.log("[SSE] tab visible but stream not open — reconnecting");
        hardReconnect();
      } else {
        // Force a liveness probe: if we don't hear back within staleAfterMs,
        // the health timer will handle it. Optionally, ping the server here.
        lastMessageAtRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // --- Reconnect when we come back online ---
    const onOnline = () => {
      console.log("[SSE] network online — reconnecting");
      hardReconnect();
    };
    window.addEventListener("online", onOnline);

    return () => {
      disposedRef.current = true;
      window.clearInterval(healthTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      cleanup();
    };

    // ---------- internals ----------

    function connect() {
      if (disposedRef.current || !token) return;
      cleanup(); // ensure no dangling source

      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const url = `${baseUrl}/events/stream?token=${encodeURIComponent(token)}`;

      const source = new EventSource(url);
      sourceRef.current = source;
      lastMessageAtRef.current = Date.now();

      source.onopen = () => {
        console.log("[SSE] connected");
        reconnectAttemptsRef.current = 0;
        lastMessageAtRef.current = Date.now();
      };

      source.onmessage = (e) => {
        lastMessageAtRef.current = Date.now();
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          onEventRef.current(event);
        } catch (err) {
          console.error("[SSE] parse error", err);
        }
      };

      source.onerror = () => {
        const state = source.readyState;
        console.warn("[SSE] error, readyState =", state);

        // readyState 2 (CLOSED) = fatal; EventSource will NOT retry.
        // readyState 0 (CONNECTING) = browser is retrying on its own.
        if (state === EventSource.CLOSED) {
          scheduleReconnect();
        }
      };
    }

    function scheduleReconnect() {
      if (disposedRef.current || !token) return;
      if (reconnectTimerRef.current !== null) return; // already scheduled

      const attempt = reconnectAttemptsRef.current++;
      const delay = Math.min(30_000, 1_000 * 2 ** attempt); // 1s,2s,4s...30s
      console.log(`[SSE] reconnecting in ${delay}ms (attempt ${attempt + 1})`);

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    }

    function hardReconnect() {
      // Force a fresh EventSource regardless of current state
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      cleanup();
      connect();
    }

    function cleanup() {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.onopen = null;
        sourceRef.current.onmessage = null;
        sourceRef.current.onerror = null;
        sourceRef.current.close();
        sourceRef.current = null;
      }
    }
  }, [token, staleAfterMs, checkIntervalMs]);
};
