import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { logger } from "@/utils/logger";

/**
 * Module-scope cache: at most one in-flight/resolved load per URL, shared by
 * every component that calls useGLBLoader with that URL. Guarantees a GLB is
 * ever fetched and parsed once, no matter how many consumers mount, remount,
 * or subscribe concurrently.
 *
 * @type {Map<string, {
 *   promise: Promise<import('three').Group>,
 *   progress: number,
 *   scene: import('three').Group | null,
 *   error: Error | null,
 *   listeners: Set<(progress: number) => void>,
 * }>}
 */
const cache = new Map();

/**
 * Downloads a GLB with real byte-level progress (via the Fetch API's
 * streaming response body) and parses it with a GLTFLoader instance wired up
 * by `configureLoader`.
 *
 * This deliberately bypasses THREE.DefaultLoadingManager/useLoader entirely.
 * That manager is a single global instance shared by every loader in the app;
 * its onProgress only fires once per whole file (on request completion, not
 * on bytes), and its progress math resets toward 0 every time a new request
 * batch starts after a previous one fully drained — which happens whenever
 * *any* other loader in the app (an unrelated preload, another page's assets)
 * shares the same manager. Streaming the bytes ourselves sidesteps both
 * problems: progress is continuous and proportional to actual bytes
 * transferred, and it can never be perturbed by an unrelated load elsewhere
 * in the app.
 *
 * @param {string} url
 * @param {(loader: import('three').Loader) => void} [configureLoader]
 * @param {(progress: number) => void} [onProgress] 0-99; the caller decides
 *   when to consider the resource fully "ready" (e.g. after GPU upload).
 * @returns {Promise<import('three').Group>}
 */
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 45000;

/**
 * Robust fetch with exponential backoff retries and timeout protection for slow/flaky internet.
 */
const fetchWithRetry = async (url, onProgress) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
      }

      const total = Number(response.headers.get("content-length")) || 0;
      const reader = response.body?.getReader();

      if (!reader || !total) {
        onProgress?.(50);
        const buffer = await response.arrayBuffer();
        return buffer;
      }

      const chunks = [];
      let loaded = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress?.(Math.min(90, Math.round((loaded / total) * 90)));
      }

      const merged = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      return merged.buffer;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const isAbort = err.name === "AbortError";
      const errorMsg = isAbort
        ? "Network request timed out"
        : err.message || "Network error";

      logger.warn(
        `[useGLBLoader] Attempt ${attempt}/${MAX_RETRIES} failed for ${url} (${errorMsg}). Retrying...`,
      );

      if (attempt < MAX_RETRIES) {
        // Exponential backoff with jitter (1s, 2s, 4s)
        const delay = Math.min(
          1000 * Math.pow(2, attempt - 1) + Math.random() * 500,
          5000,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw (
    lastError ||
    new Error(`Failed to load ${url} after ${MAX_RETRIES} attempts`)
  );
};

/**
 * Downloads a GLB with real byte-level progress (via streaming fetch with retries)
 * and parses it safely.
 *
 * @param {string} url
 * @param {(loader: import('three').Loader) => void} [configureLoader]
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<import('three').Group>}
 */
const fetchAndParseGLB = async (url, configureLoader, onProgress) => {
  const buffer = await fetchWithRetry(url, onProgress);

  onProgress?.(95);

  const loader = new GLTFLoader();
  configureLoader?.(loader);
  const resourcePath = THREE.LoaderUtils.extractUrlBase(url);

  const scene = await new Promise((resolve, reject) => {
    loader.parse(
      buffer,
      resourcePath,
      (gltf) => resolve(gltf.scene),
      (error) => reject(error),
    );
  });

  onProgress?.(99);
  return scene;
};

const getOrCreateEntry = (url, configureLoader) => {
  let entry = cache.get(url);
  if (entry) return entry;

  entry = {
    promise: null,
    progress: 0,
    scene: null,
    error: null,
    listeners: new Set(),
  };

  const notify = (progress) => {
    entry.progress = progress;
    entry.listeners.forEach((listener) => listener(progress));
  };

  entry.promise = fetchAndParseGLB(url, configureLoader, notify)
    .then((scene) => {
      entry.scene = scene;
      notify(100);
      return scene;
    })
    .catch((error) => {
      // Don't cache failures — the next mount should get a real retry
      // instead of being stuck replaying the same rejected promise.
      cache.delete(url);
      entry.error = error;
      logger.error(`[useGLBLoader] Failed to load ${url}`, error);
      throw error;
    });

  cache.set(url, entry);
  return entry;
};

/**
 * Fetches and parses a single GLB with real byte-level download progress,
 * fully decoupled from THREE.DefaultLoadingManager. Safe to call from
 * multiple components/mounts — the underlying fetch+parse runs at most once
 * per URL; every subscriber shares the same in-flight/resolved result.
 *
 * @param {string | null | undefined} url
 * @param {(loader: import('three').Loader) => void} [configureLoader]
 * @returns {{ scene: import('three').Group | null, progress: number, error: Error | null, isLoading: boolean }}
 */
export const useGLBLoader = (url, configureLoader) => {
  const configureLoaderRef = useRef(configureLoader);
  configureLoaderRef.current = configureLoader;

  const [state, setState] = useState(() => {
    const entry = url ? cache.get(url) : null;
    return {
      scene: entry?.scene ?? null,
      progress: entry?.progress ?? 0,
      error: entry?.error ?? null,
    };
  });

  useEffect(() => {
    if (!url) return undefined;

    let cancelled = false;
    const entry = getOrCreateEntry(url, configureLoaderRef.current);

    const handleProgress = (progress) => {
      if (!cancelled) setState((prev) => ({ ...prev, progress }));
    };
    entry.listeners.add(handleProgress);

    // Sync immediately in case the entry already resolved/errored/progressed
    // before this consumer subscribed.
    setState({
      scene: entry.scene,
      progress: entry.progress,
      error: entry.error,
    });

    entry.promise
      .then((scene) => {
        if (!cancelled) setState({ scene, progress: 100, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((prev) => ({ ...prev, error }));
      });

    return () => {
      cancelled = true;
      entry.listeners.delete(handleProgress);
    };
  }, [url]);

  return {
    scene: state.scene,
    progress: state.progress,
    error: state.error,
    isLoading: !state.scene && !state.error,
  };
};

/**
 * Evicts a cached GLB so the next mount performs a real re-fetch/re-parse.
 * Callers are responsible for disposing the previous scene's GPU resources
 * first (see disposeThreeScene in utils/preloader.js).
 *
 * @param {string} url
 */
export const clearGLBCache = (url) => {
  cache.delete(url);
};

/**
 * Synchronously reads whatever scene is currently cached for a URL, or null
 * if it hasn't resolved (or was never requested). Mirrors drei's
 * `useGLTF.get()` for callers that need the loaded object outside of a hook
 * (e.g. a cleanup/reset handler).
 *
 * @param {string} url
 * @returns {import('three').Group | null}
 */
export const getCachedGLBScene = (url) => cache.get(url)?.scene ?? null;

export default useGLBLoader;
