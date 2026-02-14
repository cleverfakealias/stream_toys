import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NEURAL_PARAM_DEFAULTS, NEURAL_PRESETS, type NeuralParams, type NeuralPreset } from '../engine/configNeural';

export function useNeuralParams(): NeuralParams {
    const [searchParams] = useSearchParams();

    return useMemo(() => {
        const preset = (searchParams.get('preset') as NeuralPreset) || NEURAL_PARAM_DEFAULTS.preset;
        const base = { ...NEURAL_PARAM_DEFAULTS, ...(NEURAL_PRESETS[preset] || {}) };

        const params: NeuralParams = {
            preset,
            particleCount: parseInt(searchParams.get('particleCount') || '') || base.particleCount,
            particleSize: parseFloat(searchParams.get('particleSize') || '') || base.particleSize,
            interactionRadius: parseFloat(searchParams.get('interactionRadius') || '') || base.interactionRadius,
            speed: parseFloat(searchParams.get('speed') || '') || base.speed,
            primaryColor: searchParams.get('primaryColor') || base.primaryColor,
            accentColor: searchParams.get('accentColor') || base.accentColor,
            backgroundColor: searchParams.get('backgroundColor') || base.backgroundColor,
            glowIntensity: parseFloat(searchParams.get('glowIntensity') || '') || base.glowIntensity,
            rimIntensity: parseFloat(searchParams.get('rimIntensity') || '') || base.rimIntensity,
            debug: searchParams.get('debug') === 'true' || base.debug,
        };

        return params;
    }, [searchParams]);
}
