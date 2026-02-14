import React from 'react';

interface FogLayerProps {
    color?: string;
    density?: number;
}

export const FogLayer: React.FC<FogLayerProps> = ({
    color = '#1a1a1a', // Dark base
    density = 0.02,
}) => {
    // We use standard React Three Fiber <fog> for scene-wide fog
    // And maybe a moving plane for local fog if needed, but let's start simple
    // as per "Avoid heavy shader complexity"

    return (
        <fogExp2 attach="fog" args={[color, density]} />
    );
};
