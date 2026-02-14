import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG_V1, type V1ParticleEffect } from '../../engine/configV1';

interface ParticleFieldV1Props {
  effect: V1ParticleEffect;
  qualityMult?: number; // multiplier for count (from quality tier)
}

/**
 * V1 Multi-Effect Particle System
 * Supports: snow, fireflies, rain, dust, embers, stars, none
 * Each effect has unique behavior: direction, color, size, blending, speed.
 */
export function ParticleFieldV1({ effect, qualityMult = 1 }: ParticleFieldV1Props) {
  if (effect === 'none') return null;

  const cfg = CONFIG_V1.particleEffects[effect];
  if (!cfg) return null;

  // Stars should stay in the sky only; other effects look better with an extra
  // "foreground" layer so the particles read clearly in stream.
  const showForegroundLayer = effect !== 'stars';

  return (
    <>
      <ParticleSystem key={`${effect}-main`} cfg={cfg} qualityMult={qualityMult} effect={effect} layer="main" />
      {showForegroundLayer && (
        <ParticleSystem key={`${effect}-fg`} cfg={cfg} qualityMult={qualityMult} effect={effect} layer="fg" />
      )}
    </>
  );
}

// ─── Particle configuration type (matches config shape) ──────────
interface ParticleCfg {
  color: string;
  size: number;
  opacity: number;
  count: number;
  speed: number;
  drift: number;
  direction: [number, number, number];
  blending: 'additive' | 'normal';
  sizeVariance: number;
}

// ─── Core particle system ─────────────────────────────────────────
function ParticleSystem({
  cfg,
  qualityMult,
  effect,
  layer,
}: {
  cfg: ParticleCfg;
  qualityMult: number;
  effect: V1ParticleEffect;
  layer: 'main' | 'fg';
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const starsMatRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const dustBounds = CONFIG_V1.dust.bounds; // reuse bounds

  const layerCfg = useMemo(() => {
    if (layer === 'main') return cfg;

    // Foreground layer: fewer particles, but bigger/brighter so they pop.
    return {
      ...cfg,
      count: Math.max(6, Math.round(cfg.count * 0.38)),
      size: cfg.size * 1.7,
      opacity: Math.min(1, cfg.opacity * 1.25),
      speed: cfg.speed * 1.05,
      drift: cfg.drift * 1.25,
    };
  }, [cfg, layer]);

  const particleCount = Math.max(5, Math.round(layerCfg.count * qualityMult));

  // Soft radial gradient texture (shared canvas)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 32, 32);

    if (effect === 'rain') {
      // Draw a vertical streak (not a dot)
      const grad = ctx.createLinearGradient(16, 2, 16, 30);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.25, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.75, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(15, 2, 2, 28);

      // Add a soft glow around it
      const glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 12);
      glow.addColorStop(0, `rgba(255,255,255,${layer === 'fg' ? 0.38 : 0.25})`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 32, 32);
    } else {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      if (effect === 'fireflies' || effect === 'embers') {
        // Bright concentrated glow
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.75)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.18)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
      } else {
        // Default soft dot
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, `rgba(255,255,255,${layer === 'fg' ? 0.75 : 0.6})`);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [effect, layer]);

  // Per-particle random offsets (phase, speed variation, size variation)
  const spawn = useMemo(() => getSpawnRanges(effect, dustBounds, layer), [effect, dustBounds, layer]);

  const { positions, phases, speedVariance, seeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const ph = new Float32Array(particleCount);
    const sv = new Float32Array(particleCount);
    const sd = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = lerp(spawn.xMin, spawn.xMax, Math.random());
      pos[i * 3 + 1] = lerp(spawn.yMin, spawn.yMax, Math.random());
      pos[i * 3 + 2] = lerp(spawn.zMin, spawn.zMax, Math.random());

      ph[i] = Math.random() * Math.PI * 2;
      sv[i] = 0.6 + Math.random() * 0.8; // 0.6..1.4x speed
      sd[i] = Math.random();
    }

    return { positions: pos, phases: ph, speedVariance: sv, seeds: sd };
  }, [particleCount, spawn]);

  // Animate particles
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

     if (effect === 'stars' && starsMatRef.current) {
      starsMatRef.current.uniforms.uTime.value = t;
    }

    const posAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;

    const [dx, dy, dz] = layerCfg.direction;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const phase = phases[i];
      const spdMult = speedVariance[i];

      // Primary directional movement
      posAttr.array[idx] += dx * layerCfg.speed * spdMult * delta * 60;
      posAttr.array[idx + 1] += dy * layerCfg.speed * spdMult * delta * 60;
      posAttr.array[idx + 2] += dz * layerCfg.speed * spdMult * delta * 60;

      // Effect-specific secondary motion
      switch (effect) {
        case 'snow':
          // Gentle horizontal float
          posAttr.array[idx] +=
            Math.sin(t * 0.25 + phase) * layerCfg.drift * delta * 60;
          break;

        case 'fireflies':
          // Random wandering (sinusoidal X/Y/Z)
          posAttr.array[idx] +=
            Math.sin(t * 0.6 + phase) * layerCfg.drift * delta * 60;
          posAttr.array[idx + 1] +=
            Math.cos(t * 0.4 + phase * 1.3) * layerCfg.drift * 0.7 * delta * 60;
          posAttr.array[idx + 2] +=
            Math.sin(t * 0.3 + phase * 0.7) * layerCfg.drift * 0.3 * delta * 60;
          break;

        case 'rain':
          // Very slight horizontal drift
          posAttr.array[idx] +=
            Math.sin(phase) * layerCfg.drift * delta * 60;
          break;

        case 'dust':
          // Lazy floating meander
          posAttr.array[idx] +=
            Math.sin(t * 0.15 + phase) * layerCfg.drift * delta * 60;
          posAttr.array[idx + 1] +=
            Math.cos(t * 0.1 + phase * 1.5) * layerCfg.drift * 0.3 * delta * 60;
          break;

        case 'embers':
          // Upward spiral wobble
          posAttr.array[idx] +=
            Math.sin(t * 0.8 + phase) * layerCfg.drift * delta * 60;
          posAttr.array[idx + 2] +=
            Math.cos(t * 0.6 + phase * 1.2) * layerCfg.drift * 0.4 * delta * 60;
          break;

        case 'stars':
          // Very subtle twinkle-drift
          posAttr.array[idx] +=
            Math.sin(t * 0.05 + phase) * layerCfg.drift * delta * 60;
          posAttr.array[idx + 1] +=
            Math.cos(t * 0.04 + phase * 1.1) * layerCfg.drift * delta * 60;
          break;
      }

      // ─── Respawn logic ──────────────────────────────────────
      const py = posAttr.array[idx + 1];
      const px = posAttr.array[idx];

      // Direction-aware respawn (keeps effect consistent)
      if (py < spawn.yMin) {
        posAttr.array[idx + 1] = spawn.yMax;
        posAttr.array[idx] = lerp(spawn.xMin, spawn.xMax, Math.random());
        posAttr.array[idx + 2] = lerp(spawn.zMin, spawn.zMax, Math.random());
      }
      if (py > spawn.yMax) {
        posAttr.array[idx + 1] = spawn.yMin;
        posAttr.array[idx] = lerp(spawn.xMin, spawn.xMax, Math.random());
        posAttr.array[idx + 2] = lerp(spawn.zMin, spawn.zMax, Math.random());
      }

      // Wrap X
      if (px < spawn.xMin) posAttr.array[idx] = spawn.xMax;
      if (px > spawn.xMax) posAttr.array[idx] = spawn.xMin;
    }

    posAttr.needsUpdate = true;
  });

  const blendMode =
    layerCfg.blending === 'additive'
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;

  const screenSpaceSize = effect === 'rain' || effect === 'stars';
  const isStars = effect === 'stars';
  const starsColor = useMemo(() => new THREE.Color(layerCfg.color), [layerCfg.color]);

  const starsUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uSize: { value: layerCfg.size },
      uOpacity: { value: layerCfg.opacity },
      uColor: { value: starsColor },
    };
  }, [layerCfg.opacity, layerCfg.size, starsColor]);

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      {isStars ? (
        <shaderMaterial
          ref={starsMatRef}
          transparent
          depthWrite={false}
          depthTest
          blending={blendMode}
          toneMapped={false}
          uniforms={starsUniforms}
          vertexShader={/* glsl */ `
            attribute float aSeed;
            uniform float uTime;
            uniform float uSize;
            varying float vTwinkle;

            float hash(float n) { return fract(sin(n) * 43758.5453123); }

            void main() {
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

              float speed = 0.9 + hash(aSeed * 91.17) * 2.2;
              float phase = aSeed * 6.28318530718;
              float tw = 0.6 + 0.4 * sin(uTime * speed + phase);
              vTwinkle = tw;

              gl_PointSize = uSize * (0.85 + 0.55 * tw);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={/* glsl */ `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vTwinkle;

            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float r = length(uv);

              float halo = smoothstep(0.5, 0.0, r);
              float core = smoothstep(0.14, 0.0, r);
              float alpha = halo * 0.6 + core * 0.4;

              alpha *= uOpacity * (0.55 + 0.55 * vTwinkle);

              gl_FragColor = vec4(uColor, alpha);
            }
          `}
        />
      ) : (
        <pointsMaterial
          map={texture}
          color={layerCfg.color}
          size={layerCfg.size}
          transparent
          opacity={layerCfg.opacity}
          sizeAttenuation={!screenSpaceSize}
          depthWrite={false}
          depthTest={false}
          fog={false}
          toneMapped={false}
          blending={blendMode}
          alphaTest={layerCfg.blending === 'additive' ? 0.001 : 0.01}
        />
      )}
    </points>
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getSpawnRanges(
  effect: V1ParticleEffect,
  base: { x: number; y: number; z: number },
  layer: 'main' | 'fg',
): { xMin: number; xMax: number; yMin: number; yMax: number; zMin: number; zMax: number } {
  // Camera is at z=+10 looking toward negative z.
  // Keep most particles between the camera and mountains; stars live farther back and higher up.
  switch (effect) {
    case 'stars':
      return {
        xMin: -120,
        xMax: 120,
        // Keep stars entirely above mountain ridgelines
        yMin: Math.max(14, base.y * 0.8),
        yMax: base.y + 14,
        zMin: -130,
        zMax: -60,
      };
    case 'fireflies':
      return {
        xMin: layer === 'fg' ? -14 : -22,
        xMax: layer === 'fg' ? 14 : 22,
        yMin: layer === 'fg' ? 0.5 : -1,
        yMax: layer === 'fg' ? 9 : 8,
        zMin: layer === 'fg' ? -14 : -28,
        zMax: layer === 'fg' ? -4 : -10,
      };
    case 'embers':
      return {
        xMin: layer === 'fg' ? -12 : -18,
        xMax: layer === 'fg' ? 12 : 18,
        yMin: -5.5,
        yMax: layer === 'fg' ? 7.5 : 6,
        zMin: layer === 'fg' ? -12 : -22,
        zMax: layer === 'fg' ? -3.5 : -8,
      };
    case 'rain':
      return {
        xMin: -(layer === 'fg' ? base.x * 0.45 : base.x * 0.6),
        xMax: layer === 'fg' ? base.x * 0.45 : base.x * 0.6,
        yMin: -6,
        yMax: base.y + 2,
        zMin: layer === 'fg' ? -14 : -base.z - 4,
        zMax: layer === 'fg' ? -2.5 : -6,
      };
    case 'dust':
      return {
        xMin: -(layer === 'fg' ? base.x * 0.4 : base.x * 0.55),
        xMax: layer === 'fg' ? base.x * 0.4 : base.x * 0.55,
        yMin: layer === 'fg' ? -1 : -2,
        yMax: layer === 'fg' ? base.y * 0.75 : base.y * 0.9,
        zMin: layer === 'fg' ? -14 : -base.z - 6,
        zMax: layer === 'fg' ? -3.5 : -8,
      };
    case 'snow':
    default:
      return {
        xMin: -(layer === 'fg' ? base.x * 0.48 : base.x * 0.6),
        xMax: layer === 'fg' ? base.x * 0.48 : base.x * 0.6,
        yMin: -6,
        yMax: base.y + 2,
        zMin: layer === 'fg' ? -14 : -base.z - 4,
        zMax: layer === 'fg' ? -2.5 : -6,
      };
  }
}
