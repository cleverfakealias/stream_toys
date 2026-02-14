import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_FIREWORKS = 6;
const PARTICLES_PER_BURST = 80;

interface FireworkBurst {
    origin: THREE.Vector3;
    age: number;
    lifetime: number;
    color: THREE.Color;
    velocities: Float32Array;
    active: boolean;
}

/**
 * NeonFireworks — periodic firework bursts near the track.
 * Each burst explodes outward with gravity and fades.
 */
export function NeonFireworks({
    frequency,
    trackColor,
    accentColor,
}: {
    frequency: number;
    trackColor: string;
    accentColor: string;
}) {
    const burstTimerRef = useRef(0);

    const colors = useMemo(() => [
        new THREE.Color(trackColor),
        new THREE.Color(accentColor),
        new THREE.Color('#ffffff'),
        new THREE.Color('#ffff00'),
        new THREE.Color('#ff4400'),
    ], [trackColor, accentColor]);

    // Pool of firework bursts
    const bursts = useRef<FireworkBurst[]>(
        Array.from({ length: MAX_FIREWORKS }, () => ({
            origin: new THREE.Vector3(),
            age: 0,
            lifetime: 2.0,
            color: new THREE.Color(),
            velocities: new Float32Array(PARTICLES_PER_BURST * 3),
            active: false,
        }))
    );

    // Shared positions buffer
    const positions = useMemo(
        () => new Float32Array(MAX_FIREWORKS * PARTICLES_PER_BURST * 3),
        []
    );
    const alphas = useMemo(
        () => new Float32Array(MAX_FIREWORKS * PARTICLES_PER_BURST),
        []
    );
    const burstColors = useMemo(
        () => new Float32Array(MAX_FIREWORKS * PARTICLES_PER_BURST * 3),
        []
    );
    const sizes = useMemo(
        () => new Float32Array(MAX_FIREWORKS * PARTICLES_PER_BURST),
        []
    );

    const spawnBurst = useCallback(() => {
        const pool = bursts.current;
        const slot = pool.find((b) => !b.active);
        if (!slot) return;

        slot.active = true;
        slot.age = 0;
        slot.lifetime = 1.5 + Math.random() * 1.5;
        slot.origin.set(
            (Math.random() - 0.5) * 160,
            20 + Math.random() * 40,
            (Math.random() - 0.5) * 160
        );
        slot.color.copy(colors[Math.floor(Math.random() * colors.length)]);

        // Radial velocities
        for (let i = 0; i < PARTICLES_PER_BURST; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 8 + Math.random() * 15;
            slot.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            slot.velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            slot.velocities[i * 3 + 2] = Math.cos(phi) * speed;
        }
    }, [colors]);

    // Soft radial gradient texture
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

    const pointsRef = useRef<THREE.Points>(null!);

    useFrame((_, delta) => {
        const pool = bursts.current;

        // Spawn timer
        burstTimerRef.current += delta;
        const interval = Math.max(0.5, 3.0 - frequency * 3.0);
        if (burstTimerRef.current > interval) {
            burstTimerRef.current = 0;
            spawnBurst();
        }

        let totalParticles = 0;

        for (let b = 0; b < MAX_FIREWORKS; b++) {
            const burst = pool[b];
            const baseIdx = b * PARTICLES_PER_BURST;

            if (!burst.active) {
                // Hide inactive particles
                for (let i = 0; i < PARTICLES_PER_BURST; i++) {
                    const idx = (baseIdx + i) * 3;
                    positions[idx] = 0;
                    positions[idx + 1] = -1000;
                    positions[idx + 2] = 0;
                    alphas[baseIdx + i] = 0;
                    sizes[baseIdx + i] = 0;
                }
                continue;
            }

            burst.age += delta;
            const t = burst.age / burst.lifetime;

            if (t >= 1) {
                burst.active = false;
                continue;
            }

            // Fade out
            const alpha = Math.pow(1 - t, 2);
            // Gravity
            const gravity = -9.8 * burst.age;

            for (let i = 0; i < PARTICLES_PER_BURST; i++) {
                const idx = (baseIdx + i) * 3;
                const vx = burst.velocities[i * 3];
                const vy = burst.velocities[i * 3 + 1];
                const vz = burst.velocities[i * 3 + 2];

                positions[idx] = burst.origin.x + vx * burst.age;
                positions[idx + 1] = burst.origin.y + vy * burst.age + 0.5 * gravity * burst.age;
                positions[idx + 2] = burst.origin.z + vz * burst.age;

                alphas[baseIdx + i] = alpha;

                burstColors[idx] = burst.color.r;
                burstColors[idx + 1] = burst.color.g;
                burstColors[idx + 2] = burst.color.b;

                sizes[baseIdx + i] = (1 - t * 0.5) * 3;

                totalParticles++;
            }
        }

        // Update geometry
        if (pointsRef.current) {
            const geom = pointsRef.current.geometry;
            (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            (geom.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
            (geom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
            (geom.attributes.size as THREE.BufferAttribute).needsUpdate = true;
        }
    });


    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-alpha" args={[alphas, 1]} />
                <bufferAttribute attach="attributes-color" args={[burstColors, 3]} />
                <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
            </bufferGeometry>
            <shaderMaterial
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
                uniforms={{ uTexture: { value: texture } }}
                vertexShader={/* glsl */ `
                    attribute float alpha;
                    attribute float size;
                    varying float vAlpha;
                    varying vec3 vColor;

                    void main() {
                        vAlpha = alpha;
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `}
                fragmentShader={/* glsl */ `
                    uniform sampler2D uTexture;
                    varying float vAlpha;
                    varying vec3 vColor;

                    void main() {
                        vec4 tex = texture2D(uTexture, gl_PointCoord);
                        gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha);
                    }
                `}
                vertexColors
            />
        </points>
    );
}
