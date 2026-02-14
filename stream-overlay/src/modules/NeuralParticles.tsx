import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { NeuralParams } from '../engine/configNeural';

const vertexShader = `
  attribute float size;
  attribute vec3 customColor;

  varying vec3 vColor;
  varying vec3 vViewPosition;
  varying float vSize;

  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vSize = size;

    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  uniform vec3 lightDirection;   // normalized, in world space
  uniform vec3 lightColor;
  uniform float ambientStrength;
  uniform float rimIntensity;
  uniform float specularPower;

  varying vec3 vColor;
  varying vec3 vViewPosition;
  varying float vSize;

  void main() {
    // Derive sphere normal from point coord
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(uv, uv);

    // Discard outside sphere radius (with slight feather)
    if (r2 > 1.0) discard;

    // Reconstruct sphere normal (z points toward camera)
    vec3 normal = vec3(uv, sqrt(1.0 - r2));

    // --- Phong Lighting ---
    // Light direction in view space (approximate — treating it as constant)
    vec3 lightDir = normalize(lightDirection);
    vec3 viewDir = normalize(vViewPosition);

    // Ambient
    vec3 ambient = ambientStrength * vColor * color;

    // Diffuse (Lambert)
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * vColor * color * lightColor;

    // Specular (Blinn-Phong)
    vec3 halfDir = normalize(lightDir + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(normal, halfDir), 0.0), specularPower);
    vec3 specular = spec * lightColor * 0.6;

    // --- Fresnel Rim Glow ---
    float rim = 1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = pow(rim, 3.0);
    vec3 rimGlow = rim * rimIntensity * vColor * lightColor;

    // --- Soft edge alpha ---
    float alpha = opacity * smoothstep(1.0, 0.7, sqrt(r2));

    // --- Subtle inner glow core ---
    float core = exp(-r2 * 3.0) * 0.3;
    vec3 coreGlow = core * vColor;

    vec3 finalColor = ambient + diffuse + specular + rimGlow + coreGlow;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export function NeuralParticles({ params }: { params: NeuralParams }) {
    const { raycaster, pointer, camera } = useThree();
    const geometryRef = useRef<THREE.BufferGeometry>(null!);
    const materialRef = useRef<THREE.ShaderMaterial>(null!);
    const pointsRef = useRef<THREE.Points>(null!);

    const [positions, colors, sizes] = useMemo(() => {
        const pos = new Float32Array(params.particleCount * 3);
        const col = new Float32Array(params.particleCount * 3);
        const siz = new Float32Array(params.particleCount);

        const color1 = new THREE.Color(params.primaryColor);
        const color2 = new THREE.Color(params.accentColor);

        for (let i = 0; i < params.particleCount; i++) {
            // Spherical distribution for more natural look
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.pow(Math.random(), 0.5) * 20;
            pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = radius * Math.cos(phi);

            const mixedColor = color1.clone().lerp(color2, Math.random());
            col[i * 3] = mixedColor.r;
            col[i * 3 + 1] = mixedColor.g;
            col[i * 3 + 2] = mixedColor.b;

            // Varied sizes for depth
            siz[i] = params.particleSize * (0.5 + Math.random() * 1.0);
        }
        return [pos, col, siz];
    }, [params.particleCount, params.particleSize, params.primaryColor, params.accentColor]);

    const baseSizes = useRef<Float32Array>(new Float32Array(0));

    // Store base sizes on init
    useMemo(() => {
        baseSizes.current = new Float32Array(sizes);
    }, [sizes]);

    useFrame((state) => {
        if (!geometryRef.current) return;

        const time = state.clock.getElapsedTime();
        const sizesArray = geometryRef.current.attributes.size.array as Float32Array;
        const positionsArray = geometryRef.current.attributes.position.array as Float32Array;

        // Interactive logic
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(pointsRef.current);

        for (let i = 0; i < params.particleCount; i++) {
            // Gentle floating motion
            positionsArray[i * 3 + 1] += Math.sin(time * params.speed * 0.5 + i * 0.1) * 0.003;
            positionsArray[i * 3] += Math.cos(time * params.speed * 0.3 + i * 0.2) * 0.001;

            // Smoothly return to base size
            const base = baseSizes.current[i] || params.particleSize;
            sizesArray[i] += (base - sizesArray[i]) * 0.08;
        }

        if (intersects.length > 0) {
            for (let i = 0; i < intersects.length; i++) {
                const index = intersects[i].index;
                if (index !== undefined) {
                    sizesArray[index] = params.particleSize * 4.0;
                }
            }
        }

        geometryRef.current.attributes.size.needsUpdate = true;
        geometryRef.current.attributes.position.needsUpdate = true;
    });

    const rimIntensity = (params as any).rimIntensity ?? 0.6;

    return (
        <points ref={pointsRef}>
            <bufferGeometry ref={geometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-customColor"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                    args={[colors, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                    args={[sizes, 1]}
                />
            </bufferGeometry>
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={{
                    color: { value: new THREE.Color(0xffffff) },
                    opacity: { value: 0.9 },
                    lightDirection: { value: new THREE.Vector3(0.5, 0.8, 0.6).normalize() },
                    lightColor: { value: new THREE.Color(params.primaryColor) },
                    ambientStrength: { value: 0.15 },
                    rimIntensity: { value: rimIntensity },
                    specularPower: { value: 32.0 },
                }}
                transparent
                depthTest={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
