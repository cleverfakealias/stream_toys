import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, GodRays } from '@react-three/postprocessing';
import * as THREE from 'three';

import { useNeuralParams } from '../hooks/useNeuralParams';
import { useOverlayBridge, useOverlayText } from '../engine/overlayBridge';
import { TextOverlay } from '../modules/TextOverlay';
import { NeuralParticles } from '../modules/NeuralParticles';

/**
 * Hidden sun mesh used as a GodRays source.
 * Placed behind the particle field, emits light-shaft rays
 * through the gaps.
 */
const SunSource = ({ color, sunRef }: { color: string; sunRef: React.MutableRefObject<THREE.Mesh> }) => {
    return (
        <mesh ref={sunRef} position={[12, 8, -30]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
    );
};

function NeuralEnvironment({ params, sunRef }: { params: any; sunRef: React.MutableRefObject<THREE.Mesh> }) {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (!params.debug) {
            // Gentle orbital drift
            state.camera.position.x = Math.sin(t * 0.05) * 3;
            state.camera.position.y = Math.cos(t * 0.03) * 1.5;
            state.camera.position.z = 25 + Math.cos(t * 0.04) * 3;
            state.camera.lookAt(0, 0, 0);
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 25]} fov={45} />
            {params.debug && <OrbitControls />}

            <color attach="background" args={[params.backgroundColor]} />
            <fogExp2 attach="fog" args={[params.backgroundColor, 0.015]} />

            {/* Lighting for atmosphere */}
            <ambientLight intensity={0.3} color="#ffffff" />

            {/* Key light — illuminates particle spheres from upper-right */}
            <directionalLight
                position={[8, 6, 10]}
                intensity={2.5}
                color={params.primaryColor}
            />

            {/* Fill light — subtle accent from opposite side */}
            <pointLight
                position={[-10, -5, 8]}
                intensity={400}
                color={params.accentColor}
                distance={50}
                decay={2}
            />

            {/* Back light — creates rim lighting from behind */}
            <directionalLight
                position={[-5, 3, -15]}
                intensity={1.5}
                color={params.accentColor}
            />

            {/* GodRays light source */}
            <SunSource color={params.primaryColor} sunRef={sunRef} />

            <NeuralParticles params={params} />
        </>
    );
}

export function NeuralScene() {
    const urlParams = useNeuralParams();
    const params = useOverlayBridge(urlParams);
    const textOverride = useOverlayText();

    const sunRef = useRef<THREE.Mesh>(null!);
    const [sunReady, setSunReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setSunReady(true), 200);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: params.backgroundColor }}>
                <Canvas
                    gl={{
                        antialias: true,
                        alpha: false,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.2,
                    }}
                >
                    <Suspense fallback={null}>
                        <NeuralEnvironment params={params} sunRef={sunRef} />

                        <EffectComposer>
                            <Bloom
                                intensity={1.2 * params.glowIntensity}
                                luminanceThreshold={0.3}
                                luminanceSmoothing={0.9}
                                mipmapBlur
                            />
                            {sunReady && sunRef.current ? (
                                <GodRays
                                    sun={sunRef.current}
                                    samples={30}
                                    density={0.97}
                                    decay={0.95}
                                    weight={0.15}
                                    exposure={0.3}
                                    blur
                                />
                            ) : <></>}
                            <Noise opacity={0.04} />
                            <Vignette eskil={false} offset={0.3} darkness={0.4} />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>

            <TextOverlay textOverride={textOverride} />
        </>
    );
}
