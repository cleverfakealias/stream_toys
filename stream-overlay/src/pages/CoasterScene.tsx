import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { useCoasterParams } from '../hooks/useCoasterParams';
import { useOverlayBridge, useOverlayText } from '../engine/overlayBridge';
import { TextOverlay } from '../modules/TextOverlay';
import { CoasterTrack, createCoasterCurve } from '../modules/coaster/CoasterTrack';
import { NeonFireworks } from '../modules/coaster/NeonFireworks';

/**
 * Camera rider — attaches to the curve and follows it with physics.
 */
function CameraRider({
    speed,
    smooth,
}: {
    speed: number;
    smooth: number;
}) {
    const curve = useMemo(() => createCoasterCurve(), []);
    const { camera } = useThree();

    const progressRef = useRef(0);
    const velocityRef = useRef(0.00008);
    const smoothPos = useRef(new THREE.Vector3());
    const smoothLook = useRef(new THREE.Vector3());
    const initialized = useRef(false);

    useFrame((_, delta) => {
        const clampedDelta = Math.min(delta, 0.05); // Prevent jumps

        // Physics: velocity affected by gravity on tangent
        const tangent = curve.getTangentAt(progressRef.current);
        velocityRef.current -= tangent.y * 0.0000001 * clampedDelta * 1000;
        velocityRef.current = Math.max(
            0.00003 * speed,
            Math.min(0.00025 * speed, velocityRef.current)
        );

        progressRef.current += velocityRef.current * speed;
        if (progressRef.current >= 1) progressRef.current -= 1;
        if (progressRef.current < 0) progressRef.current += 1;

        const point = curve.getPointAt(progressRef.current);

        // Position slightly above the track
        const targetPos = point.clone();
        targetPos.y += 1.5;

        // Look-ahead point
        const lookAheadT = (progressRef.current + 0.005) % 1;
        const lookTarget = curve.getPointAt(lookAheadT);
        lookTarget.y += 1.0;

        // Smooth interpolation
        const lerpFactor = 1 - Math.pow(smooth * 0.5, clampedDelta * 60);

        if (!initialized.current) {
            smoothPos.current.copy(targetPos);
            smoothLook.current.copy(lookTarget);
            initialized.current = true;
        } else {
            smoothPos.current.lerp(targetPos, lerpFactor);
            smoothLook.current.lerp(lookTarget, lerpFactor);
        }

        camera.position.copy(smoothPos.current);
        camera.lookAt(smoothLook.current);
    });

    return null;
}

/**
 * Neon grid ground plane.
 */
function NeonGrid({ color, size = 400 }: { color: string; size?: number }) {
    const gridTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;

        const step = 32;
        for (let x = 0; x <= 512; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }
        for (let y = 0; y <= 512; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(8, 8);
        tex.needsUpdate = true;
        return tex;
    }, [color]);

    return (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.5, 0]}>
            <planeGeometry args={[size, size]} />
            <meshBasicMaterial
                map={gridTexture}
                transparent
                opacity={0.6}
                toneMapped={false}
            />
        </mesh>
    );
}

/**
 * CoasterEnvironment — all 3D content.
 */
function CoasterEnvironment({ params }: { params: any }) {
    return (
        <>
            <color attach="background" args={[params.backgroundColor]} />
            <fogExp2 attach="fog" args={[params.backgroundColor, params.fogDensity]} />

            {/* Ambient fill */}
            <ambientLight intensity={0.15} color="#ffffff" />

            {/* Key neon light from above */}
            <directionalLight
                position={[50, 80, 50]}
                intensity={0.5}
                color={params.trackColor}
            />

            {/* Track */}
            <CoasterTrack
                trackColor={params.trackColor}
                accentColor={params.accentColor}
            />

            {/* Neon grid ground */}
            <NeonGrid color={params.trackColor} />

            {/* Fireworks */}
            <NeonFireworks
                frequency={params.fireworkFrequency}
                trackColor={params.trackColor}
                accentColor={params.accentColor}
            />

            {/* Camera rider (not in debug mode) */}
            {!params.debug && (
                <CameraRider
                    speed={params.speed}
                    smooth={params.cameraSmooth}
                />
            )}
        </>
    );
}

export function CoasterScene() {
    const urlParams = useCoasterParams();
    const params = useOverlayBridge(urlParams);
    const textOverride = useOverlayText();

    return (
        <>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                    background: params.backgroundColor,
                }}
            >
                <Canvas
                    gl={{
                        antialias: true,
                        alpha: false,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.2,
                    }}
                    camera={{ fov: 65, near: 0.1, far: 500 }}
                >
                    <Suspense fallback={null}>
                        <CoasterEnvironment params={params} />

                        {params.debug && <OrbitControls />}

                        <EffectComposer>
                            <Bloom
                                intensity={2.0 * params.glowIntensity}
                                luminanceThreshold={0.1}
                                luminanceSmoothing={0.9}
                                mipmapBlur
                            />
                            <Noise opacity={0.05} />
                            <Vignette eskil={false} offset={0.3} darkness={0.5} />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>

            <TextOverlay textOverride={textOverride} />
        </>
    );
}
