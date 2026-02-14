import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG_V1 } from '../../engine/configV1';

interface DustMotesV1Props {
  count?: number;
}

/**
 * V1 Dust Motes / Snow Particles
 * Tiny, slow-drifting luminous motes. Very subtle ambient life.
 * Snow-like — drift downward with gentle horizontal float.
 */
export function DustMotesV1({ count }: DustMotesV1Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const cfg = CONFIG_V1.dust;
  const particleCount = count ?? 45;
  const timeRef = useRef(0);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const { positions, driftOffsets } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const offsets = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * cfg.bounds.x;
      pos[i * 3 + 1] = Math.random() * cfg.bounds.y - 4;
      pos[i * 3 + 2] = -Math.random() * cfg.bounds.z - 2;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, driftOffsets: offsets };
  }, [particleCount, cfg.bounds]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;

    const posAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Slow downward drift (snow-like)
      posAttr.array[idx + 1] -=
        cfg.fallSpeed * delta * (0.5 + Math.sin(driftOffsets[i]) * 0.5);
      // Gentle horizontal float
      posAttr.array[idx] +=
        Math.sin(timeRef.current * 0.25 + driftOffsets[i]) *
        cfg.driftSpeed *
        delta;

      // Respawn at top
      if (posAttr.array[idx + 1] < -5) {
        posAttr.array[idx + 1] = cfg.bounds.y - 4;
        posAttr.array[idx] = (Math.random() - 0.5) * cfg.bounds.x;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={cfg.color}
        size={cfg.size}
        transparent
        opacity={cfg.opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.01}
      />
    </points>
  );
}
