import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  V1_PARAM_DEFAULTS,
  V1_PRESETS,
  V1_PARTICLE_EFFECTS,
  type V1Params,
  type V1Preset,
  type V1QualityMode,
  type V1ParticleEffect,
} from '../engine/configV1';

/**
 * Parse V1 scene query parameters.
 * The 5 key knobs:
 *   ?exposure, ?fogFalloff, ?sunElevation, ?rayStrength, ?treeDepthTint
 * Plus: ?preset, ?quality, ?particles, ?fps, ?debug
 */
export function useV1Params(): V1Params {
  const location = useLocation();

  return useMemo(() => {
    const s = new URLSearchParams(location.search);

    // Preset first (supplies defaults that individual params override)
    let preset: V1Preset = V1_PARAM_DEFAULTS.preset;
    const pVal = s.get('preset');
    if (
      pVal === 'winterCinematic' ||
      pVal === 'broadcast' ||
      pVal === 'minimal'
    ) {
      preset = pVal;
    }
    const presetDefaults = { ...V1_PARAM_DEFAULTS, ...V1_PRESETS[preset] };

    // Quality
    let quality: V1QualityMode = presetDefaults.quality;
    const qVal = s.get('quality');
    if (
      qVal === 'low' ||
      qVal === 'medium' ||
      qVal === 'high' ||
      qVal === 'auto'
    ) {
      quality = qVal;
    }

    // Particles
    let particles: V1ParticleEffect = presetDefaults.particles;
    const partVal = s.get('particles');
    if (partVal && V1_PARTICLE_EFFECTS.includes(partVal as V1ParticleEffect)) {
      particles = partVal as V1ParticleEffect;
    }

    // Float params (0..1)
    const floatParam = (key: string, fallback: number): number => {
      const v = s.get(key);
      if (v === null) return fallback;
      const n = parseFloat(v);
      return isNaN(n) ? fallback : Math.max(0, Math.min(1, n));
    };

    // FPS
    let fps: 30 | 60 = presetDefaults.fps;
    const fVal = s.get('fps');
    if (fVal === '60') fps = 60;
    if (fVal === '30') fps = 30;

    return {
      preset,
      quality,
      particles,
      exposure: floatParam('exposure', presetDefaults.exposure),
      fogFalloff: floatParam('fogFalloff', presetDefaults.fogFalloff),
      sunElevation: floatParam('sunElevation', presetDefaults.sunElevation),
      rayStrength: floatParam('rayStrength', presetDefaults.rayStrength),
      treeDepthTint: floatParam('treeDepthTint', presetDefaults.treeDepthTint),
      fps,
      debug: s.has('debug'),
    };
  }, [location.search]);
}
