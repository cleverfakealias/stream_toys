import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  GodRays,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';

import { CONFIG_V1, type V1QualityTier } from '../engine/configV1';
import { useV1Params } from '../hooks/useV1Params';
import { useOverlayBridge, useOverlayText } from '../engine/overlayBridge';

import { SkyGradientLayer } from '../modules/v1/SkyGradientLayer';
import { SunLightSource } from '../modules/v1/SunLightSource';
import { MountainDepthLayers } from '../modules/v1/MountainDepthLayers';
import { FoothillTransitionLayer } from '../modules/v1/FoothillTransitionLayer';
import { ForestInstancedLayer } from '../modules/v1/ForestInstancedLayer';
import { SnowGroundLayer } from '../modules/v1/SnowGroundLayer';
import { AtmosphereLayer } from '../modules/v1/AtmosphereLayer';
import { ParticleFieldV1 } from '../modules/v1/ParticleFieldV1';
import { HazeSweepV1 } from '../modules/v1/HazeSweepV1';
import { HudOverlayV1 } from '../modules/v1/HudOverlayV1';
import { TextOverlay } from '../modules/TextOverlay';

/**
 * V1 Scene — Winter Mountain Cinematic
 * Cool navy sky → warm amber horizon, layered mountain ridges,
 * instanced evergreen forest, snowy ground, volumetric fog cards,
 * sun-driven god rays peeking behind ridgeline.
 *
 * The 5 knobs: exposure, fogFalloff, sunElevation, rayStrength, treeDepthTint
 */
export function V1Scene() {
  const urlParams = useV1Params();
  const params = useOverlayBridge(urlParams);
  const textOverride = useOverlayText();

  // Resolve quality — if 'auto', start at medium and let governor adjust
  const initialQuality: V1QualityTier =
    params.quality === 'auto'
      ? 'medium'
      : (params.quality as V1QualityTier);

  const [quality, setQuality] = useState<V1QualityTier>(initialQuality);
  const isAutoQuality = params.quality === 'auto';

  // Sync explicit quality changes
  useEffect(() => {
    if (params.quality !== 'auto') {
      setQuality(params.quality as V1QualityTier);
    }
  }, [params.quality]);

  const qualityCfg = CONFIG_V1.quality[quality];
  const lighting = CONFIG_V1.lighting;
  const enableGodRays = qualityCfg.godRays !== false;

  // Exposure knob modifies tone mapping exposure (0..1 → 0.7..1.4)
  const toneMappingExposure =
    lighting.toneMappingExposure * (0.7 + params.exposure * 0.7);

  return (
    <>
      {/* 3D Canvas */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      >
        <Canvas
          dpr={qualityCfg.pixelRatio}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure,
          }}
          frameloop={params.fps === 30 ? 'demand' : 'always'}
        >
          <PerspectiveCamera makeDefault position={[0, 1.5, 10]} fov={50} />

          <Suspense fallback={null}>
            {/* Background color fallback */}
            <color attach="background" args={[CONFIG_V1.sky.topColor]} />

            {/* Scene fog for depth separation */}
            <fogExp2
              attach="fog"
              args={[
                CONFIG_V1.fog.color,
                CONFIG_V1.fog.density * params.fogFalloff,
              ]}
            />

            {/* Sky dome + stars */}
            <SkyGradientLayer quality={quality} />

            {/* All 3D content + post effects */}
            <SceneContent
              quality={quality}
              params={params}
              enableGodRays={enableGodRays}
            />
          </Suspense>

          {/* Quality governor (auto mode only) */}
          {isAutoQuality && (
            <QualityGovernor
              currentQuality={quality}
              setQuality={setQuality}
            />
          )}

          {/* 30fps throttle */}
          {params.fps === 30 && <FrameThrottle fps={30} />}
        </Canvas>
      </div>

      {/* CSS Overlays */}
      <HazeSweepV1 />
      <VignetteOverlay />
      <HudOverlayV1 />
      <TextOverlay textOverride={textOverride} />
    </>
  );
}

// ─── Scene Content (3D layers + effects) ──────────────────────────
interface SceneContentProps {
  quality: V1QualityTier;
  params: ReturnType<typeof useV1Params>;
  enableGodRays: boolean;
}

function SceneContent({ quality, params, enableGodRays }: SceneContentProps) {
  const sunRef = useRef<THREE.Mesh>(null!);
  const [sunReady, setSunReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSunReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  const lighting = CONFIG_V1.lighting;
  const qualityCfg = CONFIG_V1.quality[quality];
  const showGodRays = enableGodRays && sunReady;

  return (
    <>
      {/* Snow ground plane */}
      <SnowGroundLayer />

      {/* Sun (behind ridgeline — GodRays source) */}
      <SunLightSource ref={sunRef} sunElevation={params.sunElevation} />

      {/* Mountain depth planes (4 layers, atmospheric perspective) */}
      <MountainDepthLayers
        contrastMult={params.treeDepthTint}
        segments={qualityCfg.mountainSegments}
      />

      {/* Foothills transition */}
      <FoothillTransitionLayer />

      {/* Instanced evergreen forest (3 bands) */}
      <ForestInstancedLayer
        quality={quality}
        densityMult={params.treeDepthTint}
        treeDepthTint={params.treeDepthTint}
      />

      {/* Atmospheric fog cards / bands */}
      <AtmosphereLayer quality={quality} fogMult={params.fogFalloff} />

      {/* Particle effects (snow, fireflies, rain, etc.) */}
      <ParticleFieldV1
        effect={params.particles}
        qualityMult={qualityCfg.dustCount / 45}
      />

      {/* Lighting */}
      <ambientLight
        intensity={lighting.ambient.intensity}
        color={lighting.ambient.color}
      />
      <directionalLight
        position={lighting.rim.position}
        intensity={lighting.rim.intensity}
        color={lighting.rim.color}
      />

      {/* Debug camera controls */}
      {params.debug && <OrbitControls />}

      {/* Post FX Pipeline */}
      {showGodRays ? (
        <PostFXWithGodRays sunRef={sunRef} rayStrength={params.rayStrength} />
      ) : (
        <PostFXBasic />
      )}
    </>
  );
}

// ─── Post FX: Full pipeline with GodRays ──────────────────────────
function PostFXWithGodRays({
  sunRef,
  rayStrength,
}: {
  sunRef: React.RefObject<THREE.Mesh>;
  rayStrength: number;
}) {
  const godRaysCfg = CONFIG_V1.godRays;
  const bloomCfg = CONFIG_V1.bloom;
  const vignetteCfg = CONFIG_V1.vignette;
  const noiseCfg = CONFIG_V1.noise;

  if (!sunRef.current) return <PostFXBasic />;

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomCfg.intensity}
        luminanceThreshold={bloomCfg.luminanceThreshold}
        luminanceSmoothing={bloomCfg.luminanceSmoothing}
        mipmapBlur={bloomCfg.mipmapBlur}
        kernelSize={KernelSize.MEDIUM}
      />
      <GodRays
        sun={sunRef.current}
        samples={Math.round(godRaysCfg.density * 50)}
        density={godRaysCfg.density}
        decay={godRaysCfg.decay}
        weight={godRaysCfg.weight * rayStrength}
        exposure={godRaysCfg.exposure * rayStrength}
        blur={godRaysCfg.blur}
      />
      <Noise
        opacity={noiseCfg.opacity}
        blendFunction={BlendFunction.OVERLAY}
      />
      <Vignette
        offset={vignetteCfg.offset}
        darkness={vignetteCfg.darkness}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

// ─── Post FX: Fallback without GodRays ────────────────────────────
function PostFXBasic() {
  const bloomCfg = CONFIG_V1.bloom;
  const vignetteCfg = CONFIG_V1.vignette;
  const noiseCfg = CONFIG_V1.noise;

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomCfg.intensity}
        luminanceThreshold={bloomCfg.luminanceThreshold}
        luminanceSmoothing={bloomCfg.luminanceSmoothing}
        mipmapBlur={bloomCfg.mipmapBlur}
        kernelSize={KernelSize.MEDIUM}
      />
      <Noise
        opacity={noiseCfg.opacity}
        blendFunction={BlendFunction.OVERLAY}
      />
      <Vignette
        offset={vignetteCfg.offset}
        darkness={vignetteCfg.darkness}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

// ─── Quality Governor (auto mode) ─────────────────────────────────
function QualityGovernor({
  currentQuality,
  setQuality,
}: {
  currentQuality: V1QualityTier;
  setQuality: (q: V1QualityTier) => void;
}) {
  const lowFpsFrames = useRef(0);
  const highFpsFrames = useRef(0);
  const lastTime = useRef(performance.now());

  const downgrade = useCallback(() => {
    if (currentQuality === 'high') setQuality('medium');
    else if (currentQuality === 'medium') setQuality('low');
  }, [currentQuality, setQuality]);

  const upgrade = useCallback(() => {
    if (currentQuality === 'low') setQuality('medium');
    else if (currentQuality === 'medium') setQuality('high');
  }, [currentQuality, setQuality]);

  useFrame(() => {
    const now = performance.now();
    const dt = now - lastTime.current;
    lastTime.current = now;
    if (dt <= 0) return;

    const fps = 1000 / dt;

    if (fps < 26) {
      lowFpsFrames.current++;
      highFpsFrames.current = 0;
      if (lowFpsFrames.current > 30) {
        lowFpsFrames.current = 0;
        downgrade();
      }
    } else if (fps > 34) {
      highFpsFrames.current++;
      lowFpsFrames.current = 0;
      if (highFpsFrames.current > 180) {
        highFpsFrames.current = 0;
        upgrade();
      }
    } else {
      lowFpsFrames.current = 0;
      highFpsFrames.current = 0;
    }
  });

  return null;
}

// ─── 30 FPS Throttle ──────────────────────────────────────────────
function FrameThrottle({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const interval = 1000 / fps;
    const id = window.setInterval(() => invalidate(), interval);
    return () => window.clearInterval(id);
  }, [fps, invalidate]);

  return null;
}

// ─── CSS Vignette Overlay ─────────────────────────────────────────
function VignetteOverlay() {
  const cfg = CONFIG_V1.vignette;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 45,
        background: `radial-gradient(ellipse at center, transparent 0%, transparent ${(1 - cfg.offset) * 100}%, rgba(0,0,0,${cfg.darkness * 0.3}) 100%)`,
      }}
    />
  );
}
