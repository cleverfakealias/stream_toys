import React from 'react';
import { Grid } from '@react-three/drei';
import { CONFIG } from '../engine/config';

export const GridOverlay: React.FC = () => {
    return (
        <Grid
            position={[0, -2, 0]}
            args={[100, 100]} // Size
            cellSize={1}
            cellThickness={0.5}
            cellColor={CONFIG.colors.grid}
            sectionSize={5}
            sectionThickness={1}
            sectionColor={CONFIG.colors.grid}
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
        />
    );
};
