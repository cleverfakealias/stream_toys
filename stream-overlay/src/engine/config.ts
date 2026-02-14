/**
 * Scene Configuration - Northwoods Cyber Studio
 * V1 = Basic, V2 = Cinematic
 */

export const CONFIG = {
  colors: {
    background: '#050508',      // Deep near-black with slight blue
    backgroundAlt: '#0a0c12',   // Slightly lighter for gradients
    forest: '#1a3028',          // Very muted forest green
    forestMid: '#243d32',       // Mid-tone forest
    teal: '#2a4a4a',            // Desaturated teal
    tealLight: '#3a6060',       // Lighter teal accent
    grid: '#1a2a28',            // Very dim grid color
    hud: '#8a9a98',             // Muted HUD text
    hudAccent: '#4a6a68',       // HUD accent lines
    star: '#ffffff',            // Star color
    particle: '#d0e0dd',        // Soft particle color
    scanline: '#000000',        // Scanline base (V1 compat)
  },

  // V1 Original Settings
  v1: {
    grid: {
      opacity: 1.0,
      cellSize: 1,
      fadeDistance: 30,
    },
    fog: {
      density: 0.02,
    },
    particles: {
      count: 100,
      speed: 0.4,
      size: 3,
    },
    trees: {
      swayAmplitude: 0,
      swaySpeed: 0,
    },
  },

  // V2 Cinematic Settings
  v2: {
    grid: {
      opacity: 0.15,
      cellSize: 3,
      cellThickness: 0.3,
      sectionSize: 12,
      fadeDistance: 12,
      fadeStrength: 2,
    },
    fog: {
      density: 0.045,
      driftSpeed: 0.08,
      layers: 3,
    },
    particles: {
      count: 35,
      speed: 0.08,
      size: 1.2,
      opacity: 0.4,
    },
    trees: {
      swayAmplitude: 0.015,
      swaySpeed: 0.12,
      foregroundCount: 8,
      midgroundCount: 12,
      backgroundCount: 18,
      foregroundOpacity: 0.7,
      midgroundOpacity: 0.4,
      backgroundOpacity: 0.2,
    },
    sky: {
      gradientTop: '#0a0c14',
      gradientBottom: '#050508',
      starCount: 40,
      starOpacity: 0.3,
      starSize: 0.8,
    },
    vignette: {
      strength: 0.45,
      size: 0.4,
    },
    hud: {
      opacity: 0.5,
      animationCycle: 15, // seconds
    },
  },

  // V3 Snowy Sunset Settings - Improved lighting
  v3: {
    // Sky gradient (sunset palette)
    sky: {
      topColor: '#0a0c18',        // Deep navy
      midColor: '#2a1825',        // Purple-mauve
      horizonColor: '#4a3040',    // Warm purple
      horizonGlow: '#8a5545',     // Orange-amber glow
      horizonGlowIntensity: 0.25, // Increased for sunset
    },
    // Snow ground
    snow: {
      baseColor: '#1a2535',       // Dark blue-gray
      highlightColor: '#3a4555',  // Reflective lift
      gridOpacity: 0.08,          // Faint grid traces
    },
    // Trees with rim lighting
    trees: {
      foregroundColor: '#0f1f18', // Deep evergreen
      midgroundColor: '#152520',
      backgroundTone: '#1a2a28',
      rimLightColor: '#5a5560',   // Cool sunset rim
      rimLightIntensity: 0.2,     // Min 0.1, max 0.4
      foregroundCount: 10,
      midgroundCount: 15,
      backgroundCount: 22,
      foregroundOpacity: 0.85,
      midgroundOpacity: 0.55,
      backgroundOpacity: 0.3,
      swayAmplitude: 0.008,
      swaySpeed: 0.08,
    },
    // Atmospheric fog (blue-gray, not black)
    fog: {
      color: '#1a2535',           // Blue-gray fog
      density: 0.035,
      layers: 3,
      driftSpeed: 0.06,
      layerOpacity: 0.12,
    },
    // Snow particles
    snow_particles: {
      count: 80,
      size: 1.8,
      speed: 0.5,              // INCREASED for visible motion
      windStrength: 0.15,      // Gentle horizontal sway
      opacity: 0.6,
      color: '#e8f0f8',
    },
    // Lighting floors (prevent darkness)
    lighting: {
      ambientFloor: 0.25,         // Min 0.15, never below
      ambientColor: '#2a3545',    // Blue-tinted ambient
      sunsetRimIntensity: 0.2,
      sunsetRimColor: '#6a5a60',
      sunsetRimPosition: [-8, 2, -15],
    },
    // HUD
    hud: {
      opacity: 0.4,
      accentColor: '#5a6a78',
      sweepInterval: 20,          // seconds
    },
    // Vignette
    vignette: {
      strength: 0.35,
      size: 0.45,
    },
  },

  defaults: {
    preset: 'cinematic',
    quality: 'medium',
    fps: 30,
    accent: 'forest',
  },

  layout: {
    width: 1920,
    height: 1080,
  },
} as const;
