import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../engine/config';

interface EvergreenLayerProps {
    count?: number;
    depth?: number;
    color?: string;
    zOffset?: number;
    opacity?: number;
}

export const EvergreenLayer: React.FC<EvergreenLayerProps> = ({
    count = 15,
    depth = 5,
    color = CONFIG.colors.forest,
    zOffset = -10,
    opacity = 0.8,
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate random tree positions
    const trees = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 30, // Wide spread
            y: -3 + Math.random() * 1.5,   // Varying ground level
            z: zOffset + (Math.random() - 0.5) * depth,
            scale: 0.8 + Math.random() * 0.8,
            rotation: Math.random() * Math.PI * 0.1, // Slight tilt variation
        }));
    }, [count, zOffset, depth]);

    useFrame(() => {
        if (!meshRef.current) return;

        // Static update, but we do it once or if props change
        trees.forEach((tree, i) => {
            dummy.position.set(tree.x, tree.y, tree.z);
            dummy.scale.set(tree.scale, tree.scale * 2.5, tree.scale); // Tall cones
            dummy.rotation.z = tree.rotation;
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <coneGeometry args={[1, 1, 4]} /> {/* value 4 for radial segments: low poly pyramid/tree */}
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    );
};
