/**
 * Neon Rollercoaster Template Configuration
 * Dark cyberpunk-themed rollercoaster with neon track and fireworks.
 */

export type CoasterPreset = 'NeonNight' | 'Cyberpunk' | 'Void';

export interface CoasterParams {
    preset: CoasterPreset;
    speed: number;
    trackColor: string;
    accentColor: string;
    backgroundColor: string;
    glowIntensity: number;
    fireworkFrequency: number;
    fogDensity: number;
    cameraSmooth: number;
    debug: boolean;
}

export const COASTER_PARAM_DEFAULTS: CoasterParams = {
    preset: 'NeonNight',
    speed: 1.0,
    trackColor: '#ff00ff',
    accentColor: '#00ffff',
    backgroundColor: '#050008',
    glowIntensity: 1.0,
    fireworkFrequency: 0.5,
    fogDensity: 0.008,
    cameraSmooth: 0.5,
    debug: false,
};

export const COASTER_PRESETS: Record<CoasterPreset, Partial<CoasterParams>> = {
    NeonNight: {
        speed: 1.0,
        trackColor: '#ff00ff',
        accentColor: '#00ffff',
        backgroundColor: '#050008',
        glowIntensity: 1.0,
        fireworkFrequency: 0.5,
        fogDensity: 0.008,
    },
    Cyberpunk: {
        speed: 1.6,
        trackColor: '#ff6600',
        accentColor: '#aa00ff',
        backgroundColor: '#080004',
        glowIntensity: 1.4,
        fireworkFrequency: 0.8,
        fogDensity: 0.006,
    },
    Void: {
        speed: 0.6,
        trackColor: '#ffffff',
        accentColor: '#4488ff',
        backgroundColor: '#000008',
        glowIntensity: 0.7,
        fireworkFrequency: 0.3,
        fogDensity: 0.012,
    },
};
