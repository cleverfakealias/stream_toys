import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SNOW_PARAM_DEFAULTS, SNOW_PRESETS, type SnowParams, type SnowPreset } from '../engine/configSnow';

export function useSnowParams(): SnowParams {
    const [searchParams] = useSearchParams();

    return useMemo(() => {
        const preset = (searchParams.get('preset') as SnowPreset) || SNOW_PARAM_DEFAULTS.preset;
        const base = { ...SNOW_PARAM_DEFAULTS, ...(SNOW_PRESETS[preset] || {}) };

        return {
            preset,
            particleCount: parseInt(searchParams.get('particleCount') || '') || base.particleCount,
            flakeSize: parseFloat(searchParams.get('flakeSize') || '') || base.flakeSize,
            fallSpeed: parseFloat(searchParams.get('fallSpeed') || '') || base.fallSpeed,
            windStrength: parseFloat(searchParams.get('windStrength') || '') || base.windStrength,
            rotationSpeed: parseFloat(searchParams.get('rotationSpeed') || '') || base.rotationSpeed,
            fogDensity: parseFloat(searchParams.get('fogDensity') || '') || base.fogDensity,
            layers: parseInt(searchParams.get('layers') || '') || base.layers,
            primaryColor: searchParams.get('primaryColor') || base.primaryColor,
            accentColor: searchParams.get('accentColor') || base.accentColor,
            backgroundColor: searchParams.get('backgroundColor') || base.backgroundColor,
            glowIntensity: parseFloat(searchParams.get('glowIntensity') || '') || base.glowIntensity,
            debug: searchParams.get('debug') === 'true' || base.debug,
        };
    }, [searchParams]);
}
