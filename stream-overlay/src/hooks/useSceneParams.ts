import { useMemo } from 'react';
import { CONFIG } from '../engine/config';
import type { SceneParams, Preset, Quality, ThemeAccent } from '../engine/types';

type ParticleEffect =
    | 'snow'
    | 'fireflies'
    | 'rain'
    | 'dust'
    | 'embers'
    | 'stars'
    | 'none';

export interface ExtendedSceneParams extends SceneParams {
    particles: ParticleEffect;
    hdr: boolean;
    showHud: boolean;
}

export function useSceneParams(): ExtendedSceneParams {
    const params = useMemo(() => {
        const search = new URLSearchParams(window.location.search);

        // Parse Preset
        let preset: Preset = CONFIG.defaults.preset as Preset;
        const pParam = search.get('preset');
        if (pParam === 'hype' || pParam === 'coding' || pParam === 'calm') {
            preset = pParam;
        }

        // Parse Quality
        let quality: Quality = CONFIG.defaults.quality as Quality;
        const qParam = search.get('quality');
        if (qParam === 'low' || qParam === 'medium' || qParam === 'high') {
            quality = qParam;
        }

        // Parse Accent
        let accent: ThemeAccent = CONFIG.defaults.accent as ThemeAccent;
        const aParam = search.get('accent');
        if (aParam === 'forest' || aParam === 'teal') {
            accent = aParam;
        }

        // Parse FPS
        let fps: number = CONFIG.defaults.fps;
        const fParam = search.get('fps');
        if (fParam) {
            const parsed = parseInt(fParam, 10);
            if (!isNaN(parsed) && parsed > 0) {
                fps = parsed;
            }
        }

        // Parse Particles
        let particles: ParticleEffect = 'snow';
        const particleParam = search.get('particles');
        if (particleParam === 'snow' || particleParam === 'fireflies' ||
            particleParam === 'rain' || particleParam === 'dust' ||
            particleParam === 'embers' || particleParam === 'stars' ||
            particleParam === 'none') {
            particles = particleParam;
        }

        // Parse HDR (default true, disabled with ?hdr=0)
        const hdr = search.get('hdr') !== '0';

        // Parse HUD visibility (default true, disabled with ?hud=0)
        const showHud = search.get('hud') !== '0';

        const debug = search.has('debug');

        return { preset, quality, accent, fps, debug, particles, hdr, showHud };
    }, []);

    return params;
}
