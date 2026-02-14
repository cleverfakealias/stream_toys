/**
 * V5 Northwoods Cyber Studio Configuration
 * Cinematic winter sunset with volumetric effects
 */
export const CONFIG_V5 = {
    // Quality tiers
    quality: {
        low: {
            snowCount: 30,
            treeCount: { fg: 8, mid: 12, bg: 18 },
            godRays: false,
            bloomQuality: 'simple',
            pixelRatio: 1,
        },
        medium: {
            snowCount: 60,
            treeCount: { fg: 12, mid: 18, bg: 25 },
            godRays: { samples: 30 },
            bloomQuality: 'standard',
            pixelRatio: 1.5,
        },
        high: {
            snowCount: 100,
            treeCount: { fg: 15, mid: 22, bg: 30 },
            godRays: { samples: 50 },
            bloomQuality: 'full',
            pixelRatio: 2,
        },
    },

    // Sky dome (richer sunset in top 1/3)
    sky: {
        topColor: '#080a12',       // +lift midtones slightly
        midColor: '#241828',        // richer purple-mauve
        horizonColor: '#4a3040',    // warmer
        horizonGlowColor: '#ff7744', // richer orange
        horizonGlowIntensity: 0.38, // +27% stronger glow
    },

    // Sun (emissive for GodRays)
    sun: {
        position: [0, 0.5, -50] as [number, number, number],
        color: '#ff6633',
        glowColor: '#ff9955',
        emissiveIntensity: 3.0,
        size: 4,
    },

    // Forest silhouettes (+15% depth separation)
    forest: {
        foreground: {
            zRange: [-4, -7],       // pushed closer
            color: '#060f0a',       // darker for contrast
            opacity: 1.0,
            scale: [1.3, 2.2],      // +10% larger
        },
        midground: {
            zRange: [-14, -21],     // pushed back +15%
            color: '#101a16',
            opacity: 0.85,
            scale: [0.75, 1.4],
        },
        background: {
            zRange: [-30, -42],     // pushed back +20%
            color: '#1a2838',       // bluer for atmo
            opacity: 0.6,           // more fade
            scale: [0.45, 0.9],
        },
    },

    // Snow particles
    snow: {
        color: '#e0e8f0',
        size: 0.15,
        opacity: 0.7,
        fallSpeed: 0.4,
        windStrength: 0.08,
    },

    // Fog layers
    fog: {
        color: '#1a2028',
        nearDistance: 5,
        farDistance: 60,
        density: 0.015,
    },

    // Lighting (midtone lift without washing blacks)
    lighting: {
        ambient: {
            intensity: 0.14,        // +17% lift
            color: '#2d3848',       // slightly warmer
        },
        rim: {
            intensity: 0.18,        // +20% stronger rim
            color: '#ff8855',
            position: [-10, 3, -20] as [number, number, number],
        },
        toneMappingExposure: 1.22,  // +6% exposure lift
    },

    // Post-processing
    bloom: {
        intensity: 0.8,
        luminanceThreshold: 0.85,
        luminanceSmoothing: 0.4,
        mipmapBlur: true,
    },

    godRays: {
        samples: 50,
        density: 0.95,
        decay: 0.94,
        weight: 0.4,
        exposure: 0.22,
        blur: true,
    },

    vignette: {
        offset: 0.3,
        darkness: 0.5,
    },

    noise: {
        opacity: 0.032,         // -20% visual noise
    },

    // Signature effect: Spectral haze sweep
    hazeSweep: {
        color: '#8866aa',
        opacity: 0.08,
        width: 0.3,
        duration: 4000,
        interval: 25000,
    },
};
