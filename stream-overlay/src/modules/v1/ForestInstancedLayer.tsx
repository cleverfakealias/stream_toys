import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG_V1, type V1QualityTier } from '../../engine/configV1';

interface ForestInstancedLayerProps {
  quality?: V1QualityTier;
  densityMult?: number;    // from treeDepthTint param (density aspect)
  treeDepthTint?: number;  // 0..1 — how much bg trees desaturate
}

interface TreeInstance {
  x: number;
  y: number;
  z: number;
  scale: number;
  heightVar: number;
  swayOffset: number;
  rotY: number;
}

/**
 * V1 Forest Instanced Layer
 * Three depth bands of instanced pine tree silhouettes:
 * - Foreground: large, dark, sharp
 * - Midground: medium, slightly blue-shifted
 * - Background: small, desaturated, atmospheric perspective
 *
 * treeDepthTint controls how much the background band is color-shifted
 * toward the fog/sky color for atmospheric realism.
 */
export function ForestInstancedLayer({
  quality = 'medium',
  densityMult = 0.7,
  treeDepthTint = 0.6,
}: ForestInstancedLayerProps) {
  const qualityCfg = CONFIG_V1.quality[quality];
  const treeMult = qualityCfg.treeDensityMult * densityMult;

  return (
    <group>
      <ForestBand band="background" densityMult={treeMult} treeDepthTint={treeDepthTint} />
      <ForestBand band="midground" densityMult={treeMult} treeDepthTint={treeDepthTint} />
      <ForestBand band="foreground" densityMult={treeMult} treeDepthTint={treeDepthTint} />
    </group>
  );
}

function ForestBand({
  band,
  densityMult,
  treeDepthTint,
}: {
  band: 'foreground' | 'midground' | 'background';
  densityMult: number;
  treeDepthTint: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);
  const cfg = CONFIG_V1.forest[band];

  const count = Math.max(3, Math.round(cfg.count * densityMult));

  const trees = useMemo<TreeInstance[]>(() => {
    const result: TreeInstance[] = [];
    const [zMin, zMax] = cfg.zRange;

    for (let i = 0; i < count; i++) {
      const jitterX = (Math.random() - 0.5) * cfg.spread * 2;
      // Clustering: some trees placed near previous ones
      const clusterOffset =
        result.length > 0 && Math.random() < 0.3
          ? result[Math.floor(Math.random() * result.length)].x +
            (Math.random() - 0.5) * 4
          : jitterX;

      result.push({
        x: clusterOffset,
        y: cfg.baseY + (Math.random() - 0.5) * 0.5,
        z: zMin + Math.random() * (zMax - zMin),
        scale:
          cfg.scaleRange[0] +
          Math.random() * (cfg.scaleRange[1] - cfg.scaleRange[0]),
        heightVar: 1.0 + Math.random() * cfg.heightVar,
        swayOffset: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
      });
    }
    return result;
  }, [count, cfg]);

  // Stacked-cone pine tree geometry (4 layers + trunk)
  const geometry = useMemo(() => {
    const cone1 = new THREE.ConeGeometry(0.35, 0.9, 6);
    cone1.translate(0, 2.1, 0);
    const cone2 = new THREE.ConeGeometry(0.5, 0.85, 6);
    cone2.translate(0, 1.5, 0);
    const cone3 = new THREE.ConeGeometry(0.65, 0.8, 6);
    cone3.translate(0, 0.9, 0);
    const cone4 = new THREE.ConeGeometry(0.8, 0.7, 6);
    cone4.translate(0, 0.45, 0);
    const trunk = new THREE.CylinderGeometry(0.08, 0.11, 0.3, 5);
    trunk.translate(0, 0.1, 0);
    return mergeGeometries([cone1, cone2, cone3, cone4, trunk]);
  }, []);

  // Apply depth tint to background band color
  const material = useMemo(() => {
    const baseColor = new THREE.Color(cfg.color);
    if (band === 'background') {
      const fogColor = new THREE.Color(CONFIG_V1.fog.color);
      baseColor.lerp(fogColor, treeDepthTint * 0.4);
    } else if (band === 'midground') {
      const fogColor = new THREE.Color(CONFIG_V1.fog.color);
      baseColor.lerp(fogColor, treeDepthTint * 0.15);
    }
    return new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: cfg.opacity < 1,
      opacity: cfg.opacity,
      side: THREE.DoubleSide,
    });
  }, [cfg.color, cfg.opacity, band, treeDepthTint]);

  // Initialize instance transforms
  useEffect(() => {
    if (!meshRef.current) return;
    trees.forEach((tree, i) => {
      dummy.position.set(tree.x, tree.y, tree.z);
      dummy.scale.set(tree.scale, tree.scale * tree.heightVar, tree.scale);
      dummy.rotation.y = tree.rotY;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [trees, dummy]);

  // Subtle sway animation
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    const swayAmp =
      band === 'foreground' ? 0.016 : band === 'midground' ? 0.009 : 0.004;
    const swayFreq = 0.1;

    trees.forEach((tree, i) => {
      const sway =
        Math.sin(timeRef.current * swayFreq + tree.swayOffset) * swayAmp;
      dummy.position.set(tree.x + sway, tree.y, tree.z);
      dummy.scale.set(tree.scale, tree.scale * tree.heightVar, tree.scale);
      dummy.rotation.y = tree.rotY;
      dummy.rotation.z = sway * 0.4;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

// ─── Geometry merge helper ────────────────────────────────────────
function mergeGeometries(
  geometries: THREE.BufferGeometry[],
): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIdx = 0;
  geometries.forEach((g) => {
    totalVerts += g.attributes.position.count;
    if (g.index) totalIdx += g.index.count;
  });

  const positions = new Float32Array(totalVerts * 3);
  const indices: number[] = [];
  let vOff = 0;
  let iOff = 0;

  geometries.forEach((g) => {
    const posAttr = g.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      positions[(vOff + i) * 3] = posAttr.getX(i);
      positions[(vOff + i) * 3 + 1] = posAttr.getY(i);
      positions[(vOff + i) * 3 + 2] = posAttr.getZ(i);
    }
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) {
        indices[iOff + i] = g.index.getX(i) + vOff;
      }
      iOff += g.index.count;
    }
    vOff += posAttr.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (indices.length) merged.setIndex(indices);
  return merged;
}
