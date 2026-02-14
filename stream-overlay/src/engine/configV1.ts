/**
 * V1 Mountain Cinematic Configuration
 * "Cool navy sky fading to warm amber horizon, layered mountain ridges,
 *  instanced evergreen forest, snowy ground, volumetric fog cards,
 *  sun-driven god rays peeking behind ridgeline."
 *
 * Presets: winterCinematic | broadcast | minimal
 * Quality: low | medium | high | auto
 *
 * The 5 knobs that create this exact vibe:
 *   1. Exposure       — midtone readability
 *   2. Fog falloff    — depth separation
 *   3. Sun elevation  — ray angle / composition
 *   4. Ray strength   — cinematic vs cheesy
 *   5. Tree depth tint — foreground vs background realism
 */

// ─── Quality Tier Types ──────────────────────────────────────────────
export type V1QualityTier = 'low' | 'medium' | 'high';
export type V1QualityMode = V1QualityTier | 'auto';
export type V1Preset = 'winterCinematic' | 'broadcast' | 'minimal';
export type V1ParticleEffect = 'snow' | 'fireflies' | 'rain' | 'dust' | 'embers' | 'stars' | 'none';

export const V1_PARTICLE_EFFECTS: V1ParticleEffect[] = [
  'snow', 'fireflies', 'rain', 'dust', 'embers', 'stars', 'none',
];

export interface V1QualityConfig {
  pixelRatio: number;
  treeDensityMult: number;
  godRays: false | { samples: number };
  bloomEnabled: boolean;
  fogLayers: number;
  dustCount: number;
  mountainSegments: number;
  starCount: number;
}

// ─── Query Param Defaults ────────────────────────────────────────────
export interface V1Params {
  preset: V1Preset;
  quality: V1QualityMode;
  particles: V1ParticleEffect;
  exposure: number;      // 0..1 — tone-mapping exposure
  fogFalloff: number;    // 0..1 — fog density multiplier
  sunElevation: number;  // 0..1 — sun Y position
  rayStrength: number;   // 0..1 — god ray weight
  treeDepthTint: number; // 0..1 — bg tree desaturation
  fps: 30 | 60;
  debug: boolean;
}

export const V1_PARAM_DEFAULTS: V1Params = {
  preset: 'winterCinematic',
  quality: 'medium',
  particles: 'snow',
  exposure: 0.5,
  fogFalloff: 0.55,
  sunElevation: 0.3,
  rayStrength: 0.45,
  treeDepthTint: 0.6,
  fps: 30,
  debug: false,
};

// ─── Main Config ─────────────────────────────────────────────────────
export const CONFIG_V1 = {
  // ── Quality Tiers ──────────────────────────────────────────────
  quality: {
    low: {
      pixelRatio: 1,
      treeDensityMult: 0.45,
      godRays: false as const,
      bloomEnabled: false,
      fogLayers: 1,
      dustCount: 15,
      mountainSegments: 56,
      starCount: 30,
    } satisfies V1QualityConfig,
    medium: {
      pixelRatio: 1.25,
      treeDensityMult: 1.0,
      godRays: { samples: 30 },
      bloomEnabled: true,
      fogLayers: 3,
      dustCount: 45,
      mountainSegments: 96,
      starCount: 80,
    } satisfies V1QualityConfig,
    high: {
      pixelRatio: 1.5,
      treeDensityMult: 1.4,
      godRays: { samples: 50 },
      bloomEnabled: true,
      fogLayers: 4,
      dustCount: 70,
      mountainSegments: 128,
      starCount: 140,
    } satisfies V1QualityConfig,
  },

  // ── Sky Dome (cool navy → warm amber horizon + faint stars) ────
  sky: {
    topColor: '#0a0e1a',           // cool navy-black
    upperMidColor: '#101830',      // deep slate blue
    midColor: '#1a1e38',           // muted indigo
    horizonColor: '#4a3528',       // warm dusty amber
    horizonGlowColor: '#d08535',   // rich warm amber glow
    horizonGlowIntensity: 0.55,
    horizonGlowWidth: 4.0,
    // Stars (faint, upper band only)
    starColor: '#c8d0e0',
    starMinSize: 0.6,
    starMaxSize: 1.6,
    starOpacity: 0.45,
    starUpperBand: 0.35,           // only above this normalized Y
  },

  // ── Sun (behind ridgeline — GodRays source) ───────────────────
  sun: {
    baseHeight: 3.5,
    zDepth: -42,
    color: '#ff8838',
    glowColor: '#ffaa55',
    emissiveIntensity: 3.0,
    coreSize: 2.5,
    glowSize: 5.0,
    glowOpacity: 0.12,
  },

  // ── Mountains (4 layers, back to front — atmospheric perspective) ─
  mountains: {
    far: {
      zDepth: -75,
      height: 9,
      width: 210,
      color: '#3a3855',           // hazy blue-purple (lightest)
      opacity: 0.7,
      peakCount: 5,
      roughness: 0.5,
    },
    midFar: {
      zDepth: -58,
      height: 11,
      width: 195,
      color: '#28243f',           // medium haze
      opacity: 0.85,
      peakCount: 6,
      roughness: 0.65,
    },
    mid: {
      zDepth: -44,
      height: 10,
      width: 180,
      color: '#1a1830',           // darker blue
      opacity: 0.95,
      peakCount: 5,
      roughness: 0.7,
    },
    near: {
      zDepth: -34,
      height: 8,
      width: 165,
      color: '#0e0c1e',           // near-black silhouette
      opacity: 1.0,
      peakCount: 7,
      roughness: 0.8,
    },
  },

  // ── Foothills (transition zone) ────────────────────────────────
  foothills: {
    zDepth: -22,
    height: 3.5,
    width: 185,
    color: '#0c0e18',
    opacity: 1.0,
    undulation: 0.5,
    segments: 80,
  },

  // ── Forest Layers (instanced) ──────────────────────────────────
  forest: {
    background: {
      zRange: [-24, -32] as [number, number],
      baseY: -3.8,
      count: 55,
      color: '#181c30',           // blue-shifted desaturated (atmospheric)
      opacity: 0.45,
      scaleRange: [0.35, 0.85] as [number, number],
      heightVar: 0.35,
      spread: 85,
    },
    midground: {
      zRange: [-12, -22] as [number, number],
      baseY: -4.2,
      count: 42,
      color: '#0e1a14',           // dark evergreen
      opacity: 0.78,
      scaleRange: [0.75, 1.45] as [number, number],
      heightVar: 0.5,
      spread: 65,
    },
    foreground: {
      zRange: [-2, -10] as [number, number],
      baseY: -5.2,
      count: 30,
      color: '#060d08',           // near-black green
      opacity: 1.0,
      scaleRange: [1.3, 2.6] as [number, number],
      heightVar: 0.65,
      spread: 50,
    },
  },

  // ── Snow Ground ────────────────────────────────────────────────
  snow: {
    color: '#1a2030',             // dark blue-grey snow
    highlightColor: '#354055',    // cool moonlit highlights
    planeY: -5.5,
    size: 250,
    depth: 200,
    roughnessFreq: 12.0,         // noise frequency for roughness breakup
    roughnessAmp: 0.08,          // subtle normal variation
  },

  // ── Atmospheric Fog (fog cards + depth fog) ────────────────────
  fog: {
    color: '#1c2030',
    density: 0.011,
    nearDistance: 5,
    farDistance: 75,
    // Animated haze cards in midground / valleys
    layers: [
      { y: -2.0, opacity: 0.10, speed: 0.012, scale: 45, z: -10 },
      { y: -0.5, opacity: 0.07, speed: -0.009, scale: 55, z: -20 },
      { y: 1.5, opacity: 0.05, speed: 0.007, scale: 60, z: -30 },
      { y: 3.5, opacity: 0.04, speed: -0.005, scale: 70, z: -45 },
    ],
  },

  // ── Dust / Snow Mote Particles ─────────────────────────────────
  dust: {
    color: '#c0c8d8',
    size: 0.07,
    opacity: 0.3,
    fallSpeed: 0.06,
    driftSpeed: 0.03,
    bounds: { x: 50, y: 18, z: 30 },
  },

  // ── Particle Effect Presets ────────────────────────────────────
  particleEffects: {
    snow: {
      color: '#c0c8d8',
      size: 0.16,
      opacity: 0.75,
      count: 140,
      speed: 0.055,
      drift: 0.03,
      direction: [0, -1, 0] as [number, number, number],
      blending: 'additive' as const,
      sizeVariance: 0.5,
    },
    fireflies: {
      color: '#aaff55',
      size: 0.12,
      opacity: 0.95,
      count: 55,
      speed: 0.015,
      drift: 0.08,
      direction: [0, 0.2, 0] as [number, number, number],
      blending: 'additive' as const,
      sizeVariance: 0.3,
    },
    rain: {
      color: '#8899bb',
      size: 3.8,
      opacity: 0.8,
      count: 260,
      speed: 0.85,
      drift: 0.012,
      direction: [-0.15, -1, 0] as [number, number, number],
      blending: 'normal' as const,
      sizeVariance: 0.2,
    },
    dust: {
      color: '#d4c8a8',
      size: 0.1,
      opacity: 0.55,
      count: 90,
      speed: 0.01,
      drift: 0.05,
      direction: [0.1, -0.2, 0] as [number, number, number],
      blending: 'additive' as const,
      sizeVariance: 0.6,
    },
    embers: {
      color: '#ff6622',
      size: 0.12,
      opacity: 0.95,
      count: 70,
      speed: 0.1,
      drift: 0.08,
      direction: [0.05, 1, 0] as [number, number, number],
      blending: 'additive' as const,
      sizeVariance: 0.4,
    },
    stars: {
      color: '#dde4f0',
      size: 3.2,
      opacity: 0.7,
      count: 120,
      speed: 0.003,
      drift: 0.005,
      direction: [0, 0, 0] as [number, number, number],
      blending: 'additive' as const,
      sizeVariance: 0.7,
    },
  },

  // ── Lighting ───────────────────────────────────────────────────
  lighting: {
    ambient: {
      intensity: 0.06,
      color: '#1e2840',
    },
    rim: {
      intensity: 0.12,
      color: '#ff9944',
      position: [-10, 4, -35] as [number, number, number],
    },
    toneMappingExposure: 1.05,   // base — modified by exposure knob
  },

  // ── Post-processing ────────────────────────────────────────────
  bloom: {
    intensity: 0.5,
    luminanceThreshold: 0.85,     // high threshold — only sun bleeds
    luminanceSmoothing: 0.3,
    mipmapBlur: true,
  },

  godRays: {
    density: 0.7,
    decay: 0.95,
    weight: 0.18,
    exposure: 0.12,
    blur: true,
  },

  vignette: {
    offset: 0.3,
    darkness: 0.45,                // very subtle
  },

  noise: {
    opacity: 0.02,
  },

  // ── Haze Sweep (CSS overlay) ──────────────────────────────────
  hazeSweep: {
    color: '#665544',
    opacity: 0.04,
    width: 0.3,
    duration: 6000,
    interval: 35000,
  },
} as const;

// ─── Preset Overrides ────────────────────────────────────────────────
export const V1_PRESETS: Record<V1Preset, Partial<V1Params>> = {
  winterCinematic: {
    exposure: 0.5,
    fogFalloff: 0.55,
    sunElevation: 0.3,
    rayStrength: 0.45,
    treeDepthTint: 0.6,
    particles: 'snow',
  },
  broadcast: {
    exposure: 0.55,
    fogFalloff: 0.45,
    sunElevation: 0.35,
    rayStrength: 0.3,
    treeDepthTint: 0.5,
    quality: 'medium',
    particles: 'dust',
  },
  minimal: {
    exposure: 0.6,
    fogFalloff: 0.3,
    sunElevation: 0.4,
    rayStrength: 0.15,
    treeDepthTint: 0.4,
    quality: 'low',
    particles: 'none',
  },
};
