import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SnowParams } from '../engine/configSnow';

/**
 * Procedurally generates a snowflake crystal texture on a canvas.
 * Creates 6-fold symmetric branching patterns.
 */
function createSnowflakeTexture(variant: number): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Soft outer glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    // Draw crystalline structure
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineCap = 'round';

    const armLength = size * 0.38;
    const branches = 6;

    for (let i = 0; i < branches; i++) {
        const angle = (i * Math.PI * 2) / branches;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Main arm
        ctx.lineWidth = 1.5 + variant * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLength, 0);
        ctx.stroke();

        // Branch pattern varies by variant
        const branchCount = 2 + (variant % 3);
        for (let b = 1; b <= branchCount; b++) {
            const t = (b / (branchCount + 1));
            const bx = armLength * t;
            const bLen = armLength * (0.25 + variant * 0.05) * (1 - t * 0.3);

            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(bx, 0);
            ctx.lineTo(bx + bLen * 0.7, -bLen * 0.7);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(bx, 0);
            ctx.lineTo(bx + bLen * 0.7, bLen * 0.7);
            ctx.stroke();

            // Sub-branches on larger variants
            if (variant > 2) {
                const sbLen = bLen * 0.4;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(bx + bLen * 0.5, -bLen * 0.5);
                ctx.lineTo(bx + bLen * 0.5 + sbLen * 0.5, -bLen * 0.5 - sbLen * 0.5);
                ctx.stroke();
            }
        }

        // Center dot
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(armLength * 0.95, 0, 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }

    // Bright center
    const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, 3);
    center.addColorStop(0, 'rgba(255, 255, 255, 1)');
    center.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = center;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * A single rotating particle layer.
 * Each layer has its own rotation speed and particle subset.
 */
function SnowLayer({
    params,
    layerIndex,
    totalLayers,
    texture,
}: {
    params: SnowParams;
    layerIndex: number;
    totalLayers: number;
    texture: THREE.Texture;
}) {
    const groupRef = useRef<THREE.Points>(null!);
    const timeRef = useRef(Math.random() * 100);

    const countPerLayer = Math.max(50, Math.floor(params.particleCount / totalLayers));

    // Size varies per layer — closer layers have larger flakes
    const layerDepthFactor = (layerIndex + 1) / totalLayers;
    const layerSize = params.flakeSize * (0.5 + layerDepthFactor * 0.8);
    const layerOpacity = 0.3 + layerDepthFactor * 0.5;

    // Color mixing
    const color = useMemo(() => {
        const c1 = new THREE.Color(params.primaryColor);
        const c2 = new THREE.Color(params.accentColor);
        return c1.lerp(c2, layerIndex / Math.max(1, totalLayers - 1) * 0.4);
    }, [params.primaryColor, params.accentColor, layerIndex, totalLayers]);

    const positions = useMemo(() => {
        const pos = new Float32Array(countPerLayer * 3);
        const spread = 2000;
        const height = 1000;

        for (let i = 0; i < countPerLayer; i++) {
            pos[i * 3] = (Math.random() - 0.5) * spread;
            pos[i * 3 + 1] = Math.random() * height - height / 2;
            pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
        }
        return pos;
    }, [countPerLayer]);

    // Rotation direction alternates per layer
    const rotDir = layerIndex % 2 === 0 ? 1 : -1;
    const rotSpeed = params.rotationSpeed * (0.5 + layerIndex * 0.15) * rotDir;

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        timeRef.current += delta;

        const geom = groupRef.current.geometry;
        const positionsAttr = geom.attributes.position as THREE.BufferAttribute;
        const arr = positionsAttr.array as Float32Array;

        // Rotate the entire group for parallax layering
        groupRef.current.rotation.y += rotSpeed * delta * 0.1;

        // Move flakes downward + wind drift
        for (let i = 0; i < countPerLayer; i++) {
            const idx = i * 3;

            // Fall
            arr[idx + 1] -= params.fallSpeed * (0.8 + layerDepthFactor * 0.4) * delta * 40;

            // Wind drift
            arr[idx] += Math.sin(timeRef.current * 0.3 + i * 0.01) * params.windStrength * delta * 5;
            arr[idx + 2] += Math.cos(timeRef.current * 0.2 + i * 0.015) * params.windStrength * 0.5 * delta * 5;

            // Respawn at top when fallen
            if (arr[idx + 1] < -500) {
                arr[idx + 1] = 500;
                arr[idx] = (Math.random() - 0.5) * 2000;
                arr[idx + 2] = (Math.random() - 0.5) * 2000;
            }
        }

        positionsAttr.needsUpdate = true;
    });

    return (
        <points ref={groupRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                map={texture}
                color={color}
                size={layerSize}
                transparent
                opacity={layerOpacity}
                depthWrite={false}
                depthTest={true}
                fog={true}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={true}
                alphaTest={0.001}
            />
        </points>
    );
}

/**
 * SnowfallParticles — Main component
 * Creates multiple rotating layers of crystalline snowflake sprites.
 */
export function SnowfallParticles({ params }: { params: SnowParams }) {
    // Generate 5 unique snowflake crystal textures
    const textures = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => createSnowflakeTexture(i));
    }, []);

    const layerCount = Math.max(1, Math.min(5, params.layers));

    return (
        <>
            {Array.from({ length: layerCount }, (_, i) => (
                <SnowLayer
                    key={i}
                    params={params}
                    layerIndex={i}
                    totalLayers={layerCount}
                    texture={textures[i % textures.length]}
                />
            ))}
        </>
    );
}
