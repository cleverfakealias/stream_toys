import React from 'react';
import { Sparkles } from '@react-three/drei';
import { CONFIG } from '../engine/config';
import type { ThemeAccent, Quality } from '../engine/types';

interface ParticleFieldProps {
    quality: Quality;
    accent: ThemeAccent;
    count?: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
    quality,
    accent,
    count = 100
}) => {
    const color = accent === 'teal' ? CONFIG.colors.teal : CONFIG.colors.grid;
    const speed = quality === 'low' ? 0.2 : 0.4;
    const scale = quality === 'low' ? 2 : 3;

    return (
        <Sparkles
            count={count}
            scale={20} // Spread
            size={scale}
            speed={speed}
            opacity={0.5}
            color={color}
            noise={1} // Add some randomness to movement
        />
    );
};
