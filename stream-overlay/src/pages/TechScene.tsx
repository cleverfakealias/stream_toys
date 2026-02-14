import { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { CONFIG_TECH, type TechQualityTier } from '../engine/configTech';
import { useTechParams } from '../hooks/useTechParams';
import { useOverlayBridge, useOverlayText } from '../engine/overlayBridge';
import { TextOverlay } from '../modules/TextOverlay';
import { CircuitGrid } from '../modules/tech/CircuitGrid';
import { TechComponents } from '../modules/tech/TechComponents';
import { DataFlow } from '../modules/tech/DataFlow';

function TechEnvironment({ params }: { params: any }) {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (!params.debug) {
            // Subtle camera drift
            state.camera.position.x = Math.sin(t * 0.1) * 3;
            state.camera.position.z = 18 + Math.cos(t * 0.1) * 2;
            state.camera.lookAt(0, 0, 0);
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 10, 20]} fov={45} />
            {params.debug && <OrbitControls />}

            <color attach="background" args={[params.backgroundColor]} />
            <fogExp2 attach="fog" args={[params.backgroundColor, 0.025]} />

            <Environment preset="night" />

            <ambientLight intensity={1.2} color="#ffffff" />

            {/* Main Key Lights - Using high intensity for physical units */}
            <pointLight position={[15, 10, 15]} intensity={800} color={params.primaryColor} distance={60} decay={2} />
            <pointLight position={[-15, 8, -5]} intensity={500} color={params.accentColor} distance={60} decay={2} />

            {/* Top Fill Lights */}
            <directionalLight position={[0, 20, 0]} intensity={2.5} color="#ffffff" />
            <directionalLight position={[0, 5, 20]} intensity={1.5} color={params.primaryColor} />

            <CircuitGrid density={(params as any).circuitDensity} primaryColor={params.primaryColor} accentColor={params.accentColor} />
            <TechComponents complexity={(params as any).componentComplexity} primaryColor={params.primaryColor} accentColor={params.accentColor} />
            <DataFlow speed={(params as any).dataFlowSpeed} intensity={(params as any).glowIntensity} accentColor={params.accentColor} />
        </>
    );
}

export function TechScene() {
    const urlParams = useTechParams();
    const params = useOverlayBridge(urlParams as any);
    const textOverride = useOverlayText();

    const [quality] = useState<TechQualityTier>(
        params.quality === 'auto' ? 'medium' : (params.quality as TechQualityTier)
    );

    const qualityCfg = CONFIG_TECH.quality[quality];

    return (
        <>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: CONFIG_TECH.colors.background }}>
                <Canvas
                    dpr={qualityCfg.pixelRatio}
                    gl={{
                        antialias: true,
                        alpha: false,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.0 + ((params as any).exposure - 0.5),
                    }}
                >
                    <Suspense fallback={null}>
                        <TechEnvironment params={params} />

                        <EffectComposer>
                            <Bloom
                                intensity={CONFIG_TECH.bloom.intensity * (params as any).glowIntensity}
                                luminanceThreshold={CONFIG_TECH.bloom.luminanceThreshold}
                                luminanceSmoothing={CONFIG_TECH.bloom.luminanceSmoothing}
                            />
                            <Noise opacity={0.05} />
                            <Vignette eskil={false} offset={0.3} darkness={0.4} />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>

            <TextOverlay textOverride={textOverride} />
        </>
    );
}
