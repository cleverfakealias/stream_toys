/**
 * Tech Overlay Configuration
 * "Bold technology and computer components feel. High-fidelity 3D realism,
 *  circuit trace lines, glowing data flows, and neon-lit atmosphere."
 */

export type TechQualityTier = 'low' | 'medium' | 'high';
export type TechQualityMode = TechQualityTier | 'auto';
export type TechPreset = 'Mainframe' | 'Cyberdeck' | 'DeepNet';

export interface TechParams {
    preset: TechPreset;
    quality: TechQualityMode;
    circuitDensity: number;     // 0..1
    dataFlowSpeed: number;      // 0..1
    glowIntensity: number;      // 0..1
    componentComplexity: number; // 0..1
    exposure: number;           // 0..1
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    fps: 30 | 60;
    debug: boolean;
}

export const TECH_PARAM_DEFAULTS: TechParams = {
    preset: 'Mainframe',
    quality: 'medium',
    circuitDensity: 0.6,
    dataFlowSpeed: 0.4,
    glowIntensity: 0.5,
    componentComplexity: 0.5,
    exposure: 0.5,
    primaryColor: '#00ccff',
    accentColor: '#ff00ff',
    backgroundColor: '#0a0a0f',
    fps: 60,
    debug: false,
};

export const CONFIG_TECH = {
    quality: {
        low: {
            pixelRatio: 1,
            bloomEnabled: false,
            gridSegments: 32,
            componentCount: 15,
        },
        medium: {
            pixelRatio: 1.25,
            bloomEnabled: true,
            gridSegments: 64,
            componentCount: 30,
        },
        high: {
            pixelRatio: 1.5,
            bloomEnabled: true,
            gridSegments: 128,
            componentCount: 60,
        },
    },
    colors: {
        trace: '#00ccff',
        traceGlow: '#0066ff',
        componentBase: '#2a2a35',
        componentDetail: '#666666',
        accent: '#ff00ff',
        background: '#0a0a0f',
    },
    lighting: {
        ambient: { intensity: 0.5, color: '#202025' },
        neon: { intensity: 2.0, color: '#00ccff' },
    },
    bloom: {
        intensity: 1.2,
        luminanceThreshold: 0.1,
        luminanceSmoothing: 0.9,
    },
};

export const TECH_PRESETS: Record<TechPreset, Partial<TechParams>> = {
    Mainframe: {
        circuitDensity: 0.6,
        dataFlowSpeed: 0.4,
        glowIntensity: 0.5,
        primaryColor: '#00ccff', // Cyan
        accentColor: '#0066ff',  // Deep Blue
        backgroundColor: '#050510',
    },
    Cyberdeck: {
        circuitDensity: 0.9,
        dataFlowSpeed: 0.8,
        glowIntensity: 0.8,
        primaryColor: '#00ff44', // Green
        accentColor: '#ffff00',  // Yellow
        backgroundColor: '#051005',
    },
    DeepNet: {
        circuitDensity: 0.3,
        dataFlowSpeed: 0.2,
        glowIntensity: 0.4,
        primaryColor: '#8800ff', // Purple
        accentColor: '#ff00ff',  // Magenta
        backgroundColor: '#0a050a',
    },
};
