/**
 * Snowfall Crystal Template Configuration
 * Inspired by Three.js webgl_points_sprites example.
 * "Crystalline snowflakes drifting through volumetric fog."
 */

export type SnowPreset = 'Blizzard' | 'Gentle' | 'Arctic';

export interface SnowParams {
    preset: SnowPreset;
    particleCount: number;
    flakeSize: number;
    fallSpeed: number;
    windStrength: number;
    rotationSpeed: number;
    fogDensity: number;
    layers: number;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    glowIntensity: number;
    debug: boolean;
}

export const SNOW_PARAM_DEFAULTS: SnowParams = {
    preset: 'Gentle',
    particleCount: 3000,
    flakeSize: 8.0,
    fallSpeed: 1.0,
    windStrength: 0.5,
    rotationSpeed: 0.3,
    fogDensity: 0.0008,
    layers: 5,
    primaryColor: '#ffffff',
    accentColor: '#aaccff',
    backgroundColor: '#0a0a1a',
    glowIntensity: 0.8,
    debug: false,
};

export const SNOW_PRESETS: Record<SnowPreset, Partial<SnowParams>> = {
    Blizzard: {
        particleCount: 8000,
        flakeSize: 6.0,
        fallSpeed: 2.5,
        windStrength: 1.5,
        rotationSpeed: 0.6,
        fogDensity: 0.0015,
        layers: 5,
        primaryColor: '#ffffff',
        accentColor: '#ccddff',
        backgroundColor: '#050510',
    },
    Gentle: {
        particleCount: 3000,
        flakeSize: 10.0,
        fallSpeed: 0.6,
        windStrength: 0.3,
        rotationSpeed: 0.2,
        fogDensity: 0.0006,
        layers: 5,
        primaryColor: '#ffffff',
        accentColor: '#aaddff',
        backgroundColor: '#0a0a1a',
    },
    Arctic: {
        particleCount: 5000,
        flakeSize: 5.0,
        fallSpeed: 1.2,
        windStrength: 0.8,
        rotationSpeed: 0.4,
        fogDensity: 0.0012,
        layers: 5,
        primaryColor: '#ddeeff',
        accentColor: '#6699cc',
        backgroundColor: '#020208',
    },
};
