export type Preset = 'calm' | 'hype' | 'coding';
export type Quality = 'low' | 'medium' | 'high';
export type ThemeAccent = 'forest' | 'teal';

export interface SceneParams {
    preset: Preset;
    quality: Quality;
    accent: ThemeAccent;
    fps: number;
    debug?: boolean;
}

export interface PerformanceConfig {
    pixelRatio: number;
    particleCount: number;
    fogDensity: number;
    usePostProcessing: boolean;
    shadows: boolean;
}
