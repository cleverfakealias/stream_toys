import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    COASTER_PARAM_DEFAULTS,
    COASTER_PRESETS,
    type CoasterParams,
    type CoasterPreset,
} from '../engine/configCoaster';

export function useCoasterParams(): CoasterParams {
    const [searchParams] = useSearchParams();

    return useMemo(() => {
        const preset = (searchParams.get('preset') as CoasterPreset) || COASTER_PARAM_DEFAULTS.preset;
        const base = { ...COASTER_PARAM_DEFAULTS, ...(COASTER_PRESETS[preset] || {}) };

        return {
            preset,
            speed: parseFloat(searchParams.get('speed') || '') || base.speed,
            trackColor: searchParams.get('trackColor') || base.trackColor,
            accentColor: searchParams.get('accentColor') || base.accentColor,
            backgroundColor: searchParams.get('backgroundColor') || base.backgroundColor,
            glowIntensity: parseFloat(searchParams.get('glowIntensity') || '') || base.glowIntensity,
            fireworkFrequency: parseFloat(searchParams.get('fireworkFrequency') || '') || base.fireworkFrequency,
            fogDensity: parseFloat(searchParams.get('fogDensity') || '') || base.fogDensity,
            cameraSmooth: parseFloat(searchParams.get('cameraSmooth') || '') || base.cameraSmooth,
            debug: searchParams.get('debug') === 'true' || base.debug,
        };
    }, [searchParams]);
}
