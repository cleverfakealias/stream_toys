/**
 * Neural Template Configuration
 * Inspired by Three.js interactive particles.
 * "A complex web of interconnected thoughts, reacting to your presence."
 */

export type NeuralPreset = 'Synapse' | 'Ghost' | 'Void';

export interface NeuralParams {
    preset: NeuralPreset;
    particleCount: number;
    particleSize: number;
    interactionRadius: number;
    speed: number;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    glowIntensity: number;
    rimIntensity: number;
    debug: boolean;
}

export const NEURAL_PARAM_DEFAULTS: NeuralParams = {
    preset: 'Synapse',
    particleCount: 5000,
    particleSize: 2.0,
    interactionRadius: 4.0,
    speed: 1.0,
    primaryColor: '#ffffff',
    accentColor: '#00ffff',
    backgroundColor: '#050508',
    glowIntensity: 1.0,
    rimIntensity: 0.6,
    debug: false,
};

export const NEURAL_PRESETS: Record<NeuralPreset, Partial<NeuralParams>> = {
    Synapse: {
        particleCount: 8000,
        particleSize: 1.5,
        primaryColor: '#ffffff',
        accentColor: '#00ffcc',
        backgroundColor: '#050508',
        speed: 1.2,
        rimIntensity: 0.8,
    },
    Ghost: {
        particleCount: 3000,
        particleSize: 2.5,
        primaryColor: '#8888ff',
        accentColor: '#ffffff',
        backgroundColor: '#0a0a15',
        speed: 0.5,
        rimIntensity: 1.0,
    },
    Void: {
        particleCount: 15000,
        particleSize: 0.8,
        primaryColor: '#ff00ff',
        accentColor: '#5500aa',
        backgroundColor: '#000000',
        speed: 2.0,
        rimIntensity: 0.4,
    },
};
