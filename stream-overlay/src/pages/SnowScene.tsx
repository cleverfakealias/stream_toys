import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { useSnowParams } from '../hooks/useSnowParams';
import { useOverlayBridge, useOverlayText } from '../engine/overlayBridge';
import { TextOverlay } from '../modules/TextOverlay';
import { SnowfallParticles } from '../modules/SnowfallParticles';

function SnowEnvironment({ params }: { params: any }) {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 300]} fov={75} />
            {params.debug && <OrbitControls />}

            <color attach="background" args={[params.backgroundColor]} />
            <fogExp2 attach="fog" args={[params.backgroundColor, params.fogDensity]} />

            {/* Ambient illumination for snowflakes */}
            <ambientLight intensity={0.4} color="#aabbcc" />

            {/* Key light from above — picks up the crystalline edges */}
            <directionalLight
                position={[100, 300, 200]}
                intensity={1.5}
                color={params.primaryColor}
            />

            {/* Fill light from below — subtle uplight */}
            <directionalLight
                position={[-50, -100, 100]}
                intensity={0.3}
                color={params.accentColor}
            />

            <SnowfallParticles params={params} />
        </>
    );
}

export function SnowScene() {
    const urlParams = useSnowParams();
    const params = useOverlayBridge(urlParams);
    const textOverride = useOverlayText();

    return (
        <>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, background: params.backgroundColor }}>
                <Canvas
                    gl={{
                        antialias: true,
                        alpha: false,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.0,
                    }}
                >
                    <Suspense fallback={null}>
                        <SnowEnvironment params={params} />

                        <EffectComposer>
                            <Bloom
                                intensity={0.8 * params.glowIntensity}
                                luminanceThreshold={0.4}
                                luminanceSmoothing={0.9}
                                mipmapBlur
                            />
                            <Noise opacity={0.03} />
                            <Vignette eskil={false} offset={0.3} darkness={0.4} />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>

            <TextOverlay textOverride={textOverride} />
        </>
    );
}
