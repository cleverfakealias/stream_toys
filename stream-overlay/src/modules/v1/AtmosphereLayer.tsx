import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG_V1, type V1QualityTier } from '../../engine/configV1';

interface AtmosphereLayerProps {
  quality?: V1QualityTier;
  fogMult?: number; // 0..1 from fogFalloff param
}

/**
 * V1 Atmosphere Layer
 * Animated transparent fog cards/bands drifting in midground and valleys.
 * Combined with scene-level FogExp2 for depth separation.
 * Cheap volumetric feel without actual volume rendering.
 */
export function AtmosphereLayer({
  quality = 'medium',
  fogMult = 0.55,
}: AtmosphereLayerProps) {
  const cfg = CONFIG_V1.fog;
  const qualityCfg = CONFIG_V1.quality[quality];
  const maxLayers = Math.min(qualityCfg.fogLayers, cfg.layers.length);

  return (
    <group>
      {cfg.layers.slice(0, maxLayers).map((layer, i) => (
        <FogCard key={i} layer={layer} fogMult={fogMult} index={i} />
      ))}
    </group>
  );
}

interface FogLayerConfig {
  y: number;
  opacity: number;
  speed: number;
  scale: number;
  z: number;
}

function FogCard({
  layer,
  fogMult,
  index: _index,
}: {
  layer: FogLayerConfig;
  fogMult: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cfg = CONFIG_V1.fog;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(cfg.color) },
        uOpacity: { value: layer.opacity * fogMult },
        uTime: { value: 0 },
        uSpeed: { value: layer.speed },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;

        void main() {
          float drift = uTime * uSpeed;

          // Multi-frequency noise for organic fog shape
          float noise = sin((vUv.x + drift) * 6.28 * 1.8) * 0.3 + 0.5;
          noise += sin((vUv.x + drift * 0.6) * 6.28 * 4.5) * 0.15;
          noise += sin((vUv.x * 0.5 + drift * 1.3) * 6.28 * 7.0) * 0.08;

          // Vertical falloff — fog densest at center
          float vFade = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 1.5);

          // Horizontal edge fade
          float hFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);

          float alpha = noise * vFade * hFade * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [cfg.color, layer.opacity, fogMult, layer.speed]);

  useFrame((_, delta) => {
    if (material.uniforms) {
      material.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, layer.y, layer.z]}
      rotation={[0, 0, 0]}
    >
      <planeGeometry args={[layer.scale, 6]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
