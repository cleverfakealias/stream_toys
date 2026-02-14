import { useMemo } from 'react';
import * as THREE from 'three';
import { CONFIG_V1, type V1QualityTier } from '../../engine/configV1';

interface SkyGradientLayerProps {
  quality?: V1QualityTier;
}

/**
 * V1 Sky Gradient Layer
 * Cool navy at top → warm amber near horizon.
 * Faint stars only in the upper band. Multi-stop gradient via custom shader.
 */
export function SkyGradientLayer({ quality = 'medium' }: SkyGradientLayerProps) {
  const cfg = CONFIG_V1.sky;
  const qualityCfg = CONFIG_V1.quality[quality];

  const starData = useMemo(() => {
    const count = qualityCfg.starCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const radius = 115;

    for (let i = 0; i < count; i++) {
      // Distribute only in upper hemisphere above starUpperBand
      const theta = Math.random() * Math.PI * 2;
      const minPhi = 0;
      const maxPhi = Math.PI * (0.5 - cfg.starUpperBand * 0.5);
      const phi = minPhi + Math.random() * (maxPhi - minPhi);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      sizes[i] = cfg.starMinSize + Math.random() * (cfg.starMaxSize - cfg.starMinSize);
    }
    return { positions, sizes, count };
  }, [qualityCfg.starCount, cfg]);

  const skyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(cfg.topColor) },
        uUpperMidColor: { value: new THREE.Color(cfg.upperMidColor) },
        uMidColor: { value: new THREE.Color(cfg.midColor) },
        uHorizonColor: { value: new THREE.Color(cfg.horizonColor) },
        uGlowColor: { value: new THREE.Color(cfg.horizonGlowColor) },
        uGlowIntensity: { value: cfg.horizonGlowIntensity },
        uGlowWidth: { value: cfg.horizonGlowWidth },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTopColor;
        uniform vec3 uUpperMidColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uGlowColor;
        uniform float uGlowIntensity;
        uniform float uGlowWidth;
        varying vec3 vWorldPos;

        void main() {
          float h = normalize(vWorldPos).y;

          // Multi-band sky gradient: navy top → slate → indigo → warm amber
          vec3 col = uTopColor;
          col = mix(col, uUpperMidColor, smoothstep(0.6, 0.3, h));
          col = mix(col, uMidColor, smoothstep(0.3, 0.1, h));
          col = mix(col, uHorizonColor, smoothstep(0.1, -0.05, h));

          // Horizon glow band — warm amber gaussian
          float glowCenter = -0.02;
          float glow = exp(-pow((h - glowCenter) * uGlowWidth, 2.0)) * uGlowIntensity;
          col = mix(col, uGlowColor, glow);

          // Below-horizon darken
          col *= smoothstep(-0.3, 0.0, h) * 0.4 + 0.6;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [cfg]);

  return (
    <group>
      {/* Sky dome */}
      <mesh renderOrder={-100}>
        <sphereGeometry args={[120, 48, 48]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      {/* Faint stars in upper band */}
      <points renderOrder={-99}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[starData.sizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={cfg.starColor}
          size={1.2}
          transparent
          opacity={cfg.starOpacity}
          sizeAttenuation={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
