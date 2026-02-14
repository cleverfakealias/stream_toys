import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { SceneParams, PerformanceConfig } from './types';
import { CONFIG } from './config';
import { EvergreenLayer } from '../modules/EvergreenLayer';
import { FogLayer } from '../modules/FogLayer';
import { ParticleField } from '../modules/ParticleField';
import { GridOverlay } from '../modules/GridOverlay';

interface SceneEngineProps {
    params: SceneParams;
    performance: PerformanceConfig;
}

const SceneContent: React.FC<SceneEngineProps> = ({ params, performance }) => {
    // Background color
    const bgColor = CONFIG.colors.background;

    return (
        <>
            <color attach="background" args={[bgColor]} />

            <FogLayer
                color={bgColor}
                density={performance.fogDensity}
            />

            <group position={[0, -2, -5]}>
                <EvergreenLayer
                    count={performance.particleCount / 5} // Fewer trees than particles
                    color={CONFIG.colors.forest}
                    zOffset={-10}
                />
                <EvergreenLayer
                    count={performance.particleCount / 5}
                    color={CONFIG.colors.teal}
                    zOffset={-20}
                    opacity={0.5}
                />
            </group>

            <ParticleField
                quality={params.quality}
                accent={params.accent}
                count={performance.particleCount}
            />

            <GridOverlay />

            <ambientLight intensity={0.5} />

            {params.debug && <OrbitControls />}
        </>
    );
};

export const SceneEngine: React.FC<SceneEngineProps> = (props) => {
    return (
        <Canvas
            dpr={props.performance.pixelRatio}
            gl={{ antialias: props.performance.pixelRatio < 1.5 }} // Disable AA on high DPI/low perf
        >
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
            <Suspense fallback={null}>
                <SceneContent {...props} />
            </Suspense>
        </Canvas>
    );
};
