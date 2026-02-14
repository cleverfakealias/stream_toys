import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TECH_PARAM_DEFAULTS, TECH_PRESETS, type TechParams, type TechPreset } from '../engine/configTech';

export function useTechParams(): TechParams {
    const { search } = useLocation();
    const searchParams = useMemo(() => new URLSearchParams(search), [search]);

    return useMemo(() => {
        const presetName = (searchParams.get('preset') as TechPreset) || TECH_PARAM_DEFAULTS.preset;
        const presetValues = TECH_PRESETS[presetName] || {};

        const base = { ...TECH_PARAM_DEFAULTS, ...presetValues };

        return {
            preset: presetName,
            quality: (searchParams.get('quality') as any) || base.quality,
            circuitDensity: searchParams.has('circuitDensity') ? parseFloat(searchParams.get('circuitDensity')!) : base.circuitDensity,
            dataFlowSpeed: searchParams.has('dataFlowSpeed') ? parseFloat(searchParams.get('dataFlowSpeed')!) : base.dataFlowSpeed,
            glowIntensity: searchParams.has('glowIntensity') ? parseFloat(searchParams.get('glowIntensity')!) : base.glowIntensity,
            componentComplexity: searchParams.has('componentComplexity') ? parseFloat(searchParams.get('componentComplexity')!) : base.componentComplexity,
            exposure: searchParams.has('exposure') ? parseFloat(searchParams.get('exposure')!) : base.exposure,
            primaryColor: searchParams.get('primaryColor') || base.primaryColor,
            accentColor: searchParams.get('accentColor') || base.accentColor,
            backgroundColor: searchParams.get('backgroundColor') || base.backgroundColor,
            fps: (searchParams.get('fps') === '60' ? 60 : searchParams.has('fps') ? 30 : base.fps) as 30 | 60,
            debug: searchParams.get('debug') === '1',
        };
    }, [searchParams]);
}
