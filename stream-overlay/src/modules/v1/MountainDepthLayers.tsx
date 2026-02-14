import { useMemo } from 'react';
import * as THREE from 'three';
import { CONFIG_V1 } from '../../engine/configV1';

interface MountainDepthLayersProps {
  contrastMult?: number; // 0..1 from query param (treeDepthTint drives contrast)
  segments?: number;
}

/**
 * V1 Mountain Depth Layers
 * 4 ridgeline planes stacked back-to-front with atmospheric perspective:
 * - Far layer: lightest value, lowest contrast, most haze
 * - Near layer: darkest silhouette, sharpest
 */
export function MountainDepthLayers({
  contrastMult = 0.5,
  segments = 96,
}: MountainDepthLayersProps) {
  const m = CONFIG_V1.mountains;

  return (
    <group>
      <MountainRidge config={m.far} segments={segments} contrastMult={contrastMult} seed={42} />
      <MountainRidge config={m.midFar} segments={segments} contrastMult={contrastMult} seed={97} />
      <MountainRidge config={m.mid} segments={segments} contrastMult={contrastMult} seed={173} />
      <MountainRidge config={m.near} segments={segments} contrastMult={contrastMult} seed={251} />
    </group>
  );
}

interface RidgeConfig {
  zDepth: number;
  height: number;
  width: number;
  color: string;
  opacity: number;
  peakCount: number;
  roughness: number;
}

function MountainRidge({
  config,
  segments,
  contrastMult,
  seed,
}: {
  config: RidgeConfig;
  segments: number;
  contrastMult: number;
  seed: number;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    const indices: number[] = [];

    const halfW = config.width / 2;
    const step = config.width / segments;

    // Seeded pseudo-random
    const rand = (s: number) => {
      const x = Math.sin(s * 127.1 + seed * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    // Generate ridgeline heights
    const heights: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -halfW + t * config.width;

      let h = 0;
      // Large peaks
      for (let p = 0; p < config.peakCount; p++) {
        const peakX = (rand(p * 3 + 1) - 0.5) * config.width * 0.8;
        const peakH = rand(p * 3 + 2) * config.height * (0.6 + 0.4 * contrastMult);
        const peakW = config.width * (0.08 + rand(p * 3 + 3) * 0.12);
        h += peakH * Math.exp(-((x - peakX) ** 2) / (2 * peakW ** 2));
      }

      // Detail roughness
      h += Math.sin(t * 31.4 + seed) * config.roughness * 1.2;
      h += Math.sin(t * 67.8 + seed * 2.3) * config.roughness * 0.6;
      h += Math.sin(t * 127.0 + seed * 0.7) * config.roughness * 0.3;

      // Edge falloff
      const edgeFade = Math.pow(Math.sin(t * Math.PI), 0.4);
      h *= edgeFade;
      h = Math.max(h, 0.3);

      heights.push(h);
    }

    // Build mesh: ridgeline top + bottom well below camera
    const baseY = -15;
    for (let i = 0; i <= segments; i++) {
      const x = -halfW + i * step;
      verts.push(x, heights[i], config.zDepth);
      verts.push(x, baseY, config.zDepth);
    }

    for (let i = 0; i < segments; i++) {
      const topL = i * 2;
      const botL = i * 2 + 1;
      const topR = (i + 1) * 2;
      const botR = (i + 1) * 2 + 1;
      indices.push(topL, botL, topR);
      indices.push(topR, botL, botR);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [config, segments, contrastMult, seed]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.color),
        transparent: config.opacity < 1,
        opacity: config.opacity,
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    [config.color, config.opacity],
  );

  return <mesh geometry={geometry} material={material} />;
}
