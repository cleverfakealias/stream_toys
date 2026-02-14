import { useSyncExternalStore } from 'react';
import {
  V1_PARTICLE_EFFECTS,
  type V1ParticleEffect,
} from './configV1';

// ─── Types ───────────────────────────────────────────────────────
/** Subset of V1Params that can be changed at runtime via commands */
export interface OverlayOverrides {
  particles?: V1ParticleEffect;
  text?: string;
  exposure?: number;
  fogFalloff?: number;
  sunElevation?: number;
  rayStrength?: number;
  treeDepthTint?: number;
  // Tech specific
  circuitDensity?: number;
  dataFlowSpeed?: number;
  glowIntensity?: number;
  componentComplexity?: number;
  // Neural specific
  particleCount?: number;
  particleSize?: number;
  interactionRadius?: number;
  speed?: number;
  // Shared colors
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
}

type Listener = () => void;

// ─── Singleton Store ─────────────────────────────────────────────
let overrides: OverlayOverrides = {};
const listeners = new Set<Listener>();

function getSnapshot(): OverlayOverrides {
  return overrides;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((fn) => fn());
}

function applyOverrides(patch: OverlayOverrides) {
  // Validate particle effect name if present
  if (patch.particles && !V1_PARTICLE_EFFECTS.includes(patch.particles)) {
    delete patch.particles;
  }

  overrides = { ...overrides, ...patch };
  emit();
}

function resetOverrides() {
  overrides = {};
  emit();
}

// ─── Global API for StreamerBot / OBS JS execution ──────────────
/**
 * StreamerBot can call this in an OBS browser source via:
 *   window.updateOverlay({ particles: 'rain', text: 'BRB' })
 *
 * From an OBS WebSocket "ExecuteBrowserSourceJavaScript" call.
 */
(window as unknown as Record<string, unknown>).updateOverlay = (
  patch: OverlayOverrides,
) => {
  if (patch && typeof patch === 'object') {
    applyOverrides(patch);
    console.log('[OverlayBridge] Applied override:', patch);
  }
};

/**
 * Reset all overrides back to URL defaults:
 *   window.resetOverlay()
 */
(window as unknown as Record<string, unknown>).resetOverlay = () => {
  resetOverrides();
  console.log('[OverlayBridge] Reset all overrides');
};

// ─── BroadcastChannel (config page → overlay live push) ─────────
try {
  const bc = new BroadcastChannel('overlay-commands');
  bc.onmessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'update' && data.payload) {
      applyOverrides(data.payload as OverlayOverrides);
      console.log('[OverlayBridge] BroadcastChannel update:', data.payload);
    }
    if (data.type === 'reset') {
      resetOverrides();
      console.log('[OverlayBridge] BroadcastChannel reset');
    }
  };
} catch {
  // BroadcastChannel not supported (shouldn't happen in modern browsers)
  console.warn('[OverlayBridge] BroadcastChannel unavailable');
}

// ─── React Hook ──────────────────────────────────────────────────
/**
 * Merges URL-based params with live runtime overrides.
 * Returns a reactive V1Params that updates when StreamerBot / ConfigPage
 * sends commands.
 */
export function useOverlayBridge<T>(urlParams: T): T {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  return {
    ...urlParams,
    ...snapshot,
  };
}

/**
 * Returns the current text override (or undefined if none).
 * Separate hook since text doesn't live in V1Params.
 */
export function useOverlayText(): string | undefined {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return snapshot.text;
}

// ─── Helper for ConfigPage to send live updates ─────────────────
export function sendOverlayCommand(payload: OverlayOverrides) {
  try {
    const bc = new BroadcastChannel('overlay-commands');
    bc.postMessage({ type: 'update', payload });
    bc.close();
  } catch {
    // noop
  }
}

export function sendOverlayReset() {
  try {
    const bc = new BroadcastChannel('overlay-commands');
    bc.postMessage({ type: 'reset' });
    bc.close();
  } catch {
    // noop
  }
}
