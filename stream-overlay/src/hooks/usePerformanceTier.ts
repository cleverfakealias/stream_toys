import { useMemo } from 'react';
import type { Quality, PerformanceConfig } from '../engine/types';

export function usePerformanceTier(quality: Quality): PerformanceConfig {
    return useMemo(() => {
        switch (quality) {
            case 'low':
                return {
                    pixelRatio: 1, // Strictly 1 for low end
                    particleCount: 50,
                    fogDensity: 0.02,
                    usePostProcessing: false,
                    shadows: false,
                };
            case 'high':
                return {
                    pixelRatio: Math.min(window.devicePixelRatio, 2),
                    particleCount: 200,
                    fogDensity: 0.05,
                    usePostProcessing: true,
                    shadows: true,
                };
            case 'medium':
            default:
                return {
                    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                    particleCount: 100,
                    fogDensity: 0.035,
                    usePostProcessing: false, // Keep off for safety in default
                    shadows: false,
                };
        }
    }, [quality]);
}
