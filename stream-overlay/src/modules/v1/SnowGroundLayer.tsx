import { useMemo } from 'react';
import * as THREE from 'three';
import { CONFIG_V1 } from '../../engine/configV1';

/**
 * V1 Snow Ground Layer
 * Large terrain plane with subtle noise-driven roughness variation.
 * Avoids flat color — uses a shader with faint cool highlights and
 * procedural breakup for a snowy ground feel.
 */
export function SnowGroundLayer() {
  const cfg = CONFIG_V1.snow;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uBaseColor: { value: new THREE.Color(cfg.color) },
        uHighlightColor: { value: new THREE.Color(cfg.highlightColor) },
        uFreq: { value: cfg.roughnessFreq },
        uAmp: { value: cfg.roughnessAmp },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uBaseColor;
        uniform vec3 uHighlightColor;
        uniform float uFreq;
        uniform float uAmp;
        varying vec2 vUv;

        // Simple procedural noise for roughness breakup
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          // Multi-octave noise for roughness variation
          float n = noise(vUv * uFreq) * 0.6
                  + noise(vUv * uFreq * 2.3) * 0.25
                  + noise(vUv * uFreq * 5.7) * 0.15;

          // Distance-based fade (darken edges for natural look)
          float dist = length(vUv - 0.5) * 2.0;
          float edgeFade = smoothstep(1.2, 0.3, dist);

          vec3 col = mix(uBaseColor, uHighlightColor, n * uAmp * 8.0);
          col *= (0.85 + edgeFade * 0.15);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }, [cfg]);

  return (
    <mesh
      position={[0, cfg.planeY, -30]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      <planeGeometry args={[cfg.size, cfg.depth]} />
    </mesh>
  );
}
