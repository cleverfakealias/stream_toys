import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function CyberChip({ pos, scale, color, emissive, blink, index }: any) {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

    useFrame((state) => {
        if (blink && materialRef.current) {
            const t = state.clock.getElapsedTime();
            materialRef.current.emissiveIntensity = 0.5 + Math.sin(t * 10 + index) * 0.5;
        }
    });

    return (
        <group position={pos} scale={scale}>
            {/* PCB Base */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 0.4, 1]} />
                <meshStandardMaterial color="#333344" metalness={0.4} roughness={0.6} />
            </mesh>
            {/* Heat Spreader / Core */}
            <mesh position={[0, 0.3, 0]} scale={[0.7, 1, 0.7]}>
                <boxGeometry args={[1, 0.2, 1]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Emissive Detail Lines */}
            <mesh position={[0, 0.41, 0]} scale={[0.8, 1, 0.05]}>
                <boxGeometry args={[1, 0.02, 1]} />
                <meshStandardMaterial ref={materialRef} emissive={emissive} emissiveIntensity={0.8} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 0.41, 0]} scale={[0.05, 1, 0.8]}>
                <boxGeometry args={[1, 0.02, 1]} />
                <meshStandardMaterial emissive={emissive} emissiveIntensity={0.8} transparent opacity={0.9} />
            </mesh>
        </group>
    );
}

function CyberCapacitor({ pos, scale, emissive, blink, index }: any) {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

    useFrame((state) => {
        if (blink && materialRef.current) {
            const t = state.clock.getElapsedTime();
            materialRef.current.emissiveIntensity = 1.0 + Math.sin(t * 5 + index) * 0.5;
        }
    });

    return (
        <group position={pos} scale={scale}>
            {/* Main Cylinder Body */}
            <mesh rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
                <meshStandardMaterial color="#444455" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Top Detail */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 0.1, 12]} />
                <meshStandardMaterial color="#666677" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Glowing Ring */}
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.41, 0.02, 8, 24]} />
                <meshStandardMaterial ref={materialRef} emissive={emissive} emissiveIntensity={2} color={emissive} />
            </mesh>
        </group>
    );
}

export function TechComponents({ complexity = 0.5, primaryColor = '#00ccff', accentColor = '#ff00ff' }: any) {
    const groupRef = useRef<THREE.Group>(null!);

    const components = useMemo(() => {
        const items = [];
        const gridSize = 6; // Grid divisions
        const areaSize = 35;
        const step = areaSize / gridSize;
        const halfArea = areaSize / 2;

        // Use a grid-based approach to PREVENT collisions
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                // Randomly skip slots based on complexity
                if (Math.random() > 0.4 + complexity * 0.5) continue;

                // Position within grid cell with jitter
                const posX = (x * step - halfArea) + (Math.random() - 0.5) * step * 0.7;
                const posZ = (z * step - halfArea) + (Math.random() - 0.5) * step * 0.7;

                const type = Math.random();
                const scale = 0.5 + Math.random() * 0.8;

                if (type > 0.4) {
                    items.push({
                        type: 'chip',
                        pos: [posX, 0, posZ] as [number, number, number],
                        scale: [scale, 1, scale] as [number, number, number],
                        color: (x + z) % 2 === 0 ? '#444455' : '#2a2a35',
                        emissive: (x + z) % 3 === 0 ? primaryColor : accentColor,
                        blink: Math.random() > 0.3
                    });
                } else {
                    items.push({
                        type: 'cap',
                        pos: [posX, 0.6, posZ] as [number, number, number],
                        scale: [scale * 0.5, scale * 1.5, scale * 0.5] as [number, number, number],
                        emissive: (x + z) % 4 === 0 ? accentColor : primaryColor,
                        blink: Math.random() > 0.5
                    });
                }
            }
        }
        return items;
    }, [complexity, primaryColor, accentColor]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                const c = components[i];
                if (!c) return;
                // Subtle global float
                child.position.y = (c.pos[1] as number) + Math.sin(t * 0.5 + i) * 0.15;
            });
        }
    });

    return (
        <group ref={groupRef}>
            {components.map((c, i) => (
                c.type === 'chip' ? (
                    <CyberChip key={i} {...c} index={i} />
                ) : (
                    <CyberCapacitor key={i} {...c} index={i} />
                )
            ))}
        </group>
    );
}
