/**
 * V6 Mountain Cinematic Configuration
 * "Foreground evergreen forest flowing into distant mountain ranges,
 *  sunset dropping behind mountains, soft god rays through gaps."
 *
 * Presets: mountainCinematic | broadcast | minimal
 * Quality: low | medium | high | auto
 */

// ─── Quality Tier Types ──────────────────────────────────────────────
export type QualityTier = 'low' | 'medium' | 'high';
export type QualityMode = QualityTier | 'auto';
export type V6Preset = 'mountainCinematic' | 'broadcast' | 'minimal';

export interface V6QualityConfig {
  pixelRatio: number;
  treeDensityMult: number;       // multiplier for tree counts
  godRays: false | { samples: number };
  bloomEnabled: boolean;
  fogLayers: number;
  dustCount: number;
  mountainSegments: number;
}

// ─── Query Param Defaults ────────────────────────────────────────────
export interface V6Params {
  preset: V6Preset;
  quality: QualityMode;
  sunHeight: number;     // 0..1
  rayStrength: number;   // 0..1
  fog: number;           // 0..1
  mountainContrast: number; // 0..1
  treeDensity: number;   // 0..1
  fps: 30 | 60;
  debug: boolean;
}

export const V6_PARAM_DEFAULTS: V6Params = {
  preset: 'mountainCinematic',
  quality: 'medium',
  sunHeight: 0.25,
  rayStrength: 0.5,
  fog: 0.6,
  mountainContrast: 0.5,
  treeDensity: 0.7,
  fps: 30,
  debug: false,
};

// ─── Main Config ─────────────────────────────────────────────────────
export const CONFIG_V6 = {
  // ── Quality Tiers ──────────────────────────────────────────────
  quality: {
    low: {
      pixelRatio: 1,
      treeDensityMult: 0.5,
      godRays: false as const,
      bloomEnabled: false,
      fogLayers: 1,
      dustCount: 20,
      mountainSegments: 64,
    } satisfies V6QualityConfig,
    medium: {
      pixelRatio: 1.25,
      treeDensityMult: 1.0,
      godRays: { samples: 30 },
      bloomEnabled: true,
      fogLayers: 2,
      dustCount: 50,
      mountainSegments: 96,
    } satisfies V6QualityConfig,
    high: {
      pixelRatio: 1.5,
      treeDensityMult: 1.4,
      godRays: { samples: 50 },
      bloomEnabled: true,
      fogLayers: 3,
      dustCount: 80,
      mountainSegments: 128,
    } satisfies V6QualityConfig,
  },

  // ── Sky Dome (dusk gradient) ───────────────────────────────────
  sky: {
    topColor: '#0b0e1a',          // deep navy-black
    upperMidColor: '#1a1a35',     // dark indigo
    midColor: '#2d2040',          // dusky purple
    horizonColor: '#5a3838',      // warm dusty rose
    horizonGlowColor: '#e86530',  // rich orange sunset band
    horizonGlowIntensity: 0.65,
    horizonGlowWidth: 4.5,       // controls glow band spread
  },

  // ── Sun (behind mountains) ────────────────────────────────────
  sun: {
    baseHeight: 4.0,             // Y base — near ridgeline height
    zDepth: -38,                 // just behind near mountains (z=-35)
    color: '#ff6030',
    glowColor: '#ffaa55',
    emissiveIntensity: 3.5,
    coreSize: 2.8,
    glowSize: 5.5,
    glowOpacity: 0.15,
  },

  // ── Mountains (3 layers, back to front) ────────────────────────
  mountains: {
    far: {
      zDepth: -70,
      height: 10,
      width: 200,
      color: '#2a2540',          // hazy blue-purple
      opacity: 1.0,
      peakCount: 6,
      roughness: 0.6,
    },
    mid: {
      zDepth: -50,
      height: 12,
      width: 180,
      color: '#1e1c30',          // darker blue
      opacity: 1.0,
      peakCount: 5,
      roughness: 0.7,
    },
    near: {
      zDepth: -35,
      height: 10,
      width: 160,
      color: '#12101e',          // near-black silhouette
      opacity: 1.0,
      peakCount: 7,
      roughness: 0.8,
    },
  },

  // ── Foothills (transition zone) ────────────────────────────────
  foothills: {
    zDepth: -22,
    height: 3.8,
    width: 180,
    color: '#0e1018',
    opacity: 1.0,
    undulation: 0.5,             // how "rolling" the hills are
    segments: 80,
  },

  // ── Forest Layers ──────────────────────────────────────────────
  forest: {
    // Background tree band (small, distant, desaturated)
    background: {
      zRange: [-25, -34] as [number, number],
      baseY: -3.5,
      count: 60,
      color: '#161828',          // blue-shifted silhouette
      opacity: 0.5,
      scaleRange: [0.4, 0.9] as [number, number],
      heightVar: 0.4,
      spread: 90,
    },
    // Midground tree band
    midground: {
      zRange: [-12, -22] as [number, number],
      baseY: -4.0,
      count: 45,
      color: '#101a14',          // dark forest green
      opacity: 0.82,
      scaleRange: [0.8, 1.5] as [number, number],
      heightVar: 0.5,
      spread: 70,
    },
    // Foreground tree band (large, dark, sharp)
    foreground: {
      zRange: [-2, -10] as [number, number],
      baseY: -5.0,
      count: 35,
      color: '#050c08',          // near-black green
      opacity: 1.0,
      scaleRange: [1.4, 2.8] as [number, number],
      heightVar: 0.7,
      spread: 55,
    },
  },

  // ── Atmospheric Fog ────────────────────────────────────────────
  fog: {
    color: '#1a1e2a',
    density: 0.012,
    nearDistance: 5,
    farDistance: 70,
    // Animated haze layers
    layers: [
      { y: -1.5, opacity: 0.12, speed: 0.015, scale: 40 },
      { y: 0.5, opacity: 0.08, speed: -0.01, scale: 55 },
      { y: 2.5, opacity: 0.06, speed: 0.008, scale: 65 },
    ],
  },

  // ── Dust/Mote Particles ────────────────────────────────────────
  dust: {
    color: '#d8c8b0',
    size: 0.08,
    opacity: 0.35,
    fallSpeed: 0.08,
    driftSpeed: 0.04,
    bounds: { x: 50, y: 18, z: 30 },
  },

  // ── Lighting ───────────────────────────────────────────────────
  lighting: {
    ambient: {
      intensity: 0.08,
      color: '#283040',
    },
    rim: {
      intensity: 0.15,
      color: '#ff8844',
      position: [-8, 3, -30] as [number, number, number],
    },
    toneMappingExposure: 1.1,
  },

  // ── Post-processing ────────────────────────────────────────────
  bloom: {
    intensity: 0.6,
    luminanceThreshold: 0.82,
    luminanceSmoothing: 0.35,
    mipmapBlur: true,
  },

  godRays: {
    density: 0.72,
    decay: 0.95,
    weight: 0.2,
    exposure: 0.14,
    blur: true,
  },

  vignette: {
    offset: 0.25,
    darkness: 0.55,
  },

  noise: {
    opacity: 0.025,
  },

  // ── Haze Sweep (legacy, more subtle) ──────────────────────────
  hazeSweep: {
    color: '#665544',
    opacity: 0.05,
    width: 0.35,
    duration: 5000,
    interval: 30000,
  },
} as const;

// ─── Preset Overrides ────────────────────────────────────────────────
export const V6_PRESETS: Record<V6Preset, Partial<V6Params>> = {
  mountainCinematic: {
    sunHeight: 0.25,
    rayStrength: 0.5,
    fog: 0.6,
    mountainContrast: 0.5,
    treeDensity: 0.7,
  },
  broadcast: {
    sunHeight: 0.3,
    rayStrength: 0.35,
    fog: 0.5,
    mountainContrast: 0.4,
    treeDensity: 0.6,
    quality: 'medium',
  },
  minimal: {
    sunHeight: 0.35,
    rayStrength: 0.2,
    fog: 0.35,
    mountainContrast: 0.3,
    treeDensity: 0.4,
    quality: 'low',
  },
};
