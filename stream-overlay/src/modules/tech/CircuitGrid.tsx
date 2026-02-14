import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CircuitGrid({ density = 0.6, primaryColor = '#00ccff', accentColor = '#ff00ff' }: any) {
    const meshRef = useRef<THREE.LineSegments>(null!);
    const materialRef = useRef<THREE.LineBasicMaterial>(null!);

    const lines = useMemo(() => {
        const items: THREE.Vector3[] = [];
        const size = 40;
        const step = 2;

        for (let x = -size / 2; x <= size / 2; x += step) {
            for (let z = -size / 2; z <= size / 2; z += step) {
                if (Math.random() > density) continue;

                const start = new THREE.Vector3(x, 0, z);
                const type = Math.random();

                if (type > 0.6) {
                    // X-axis line
                    items.push(start, start.clone().add(new THREE.Vector3(step, 0, 0)));
                } else if (type > 0.3) {
                    // Z-axis line
                    items.push(start, start.clone().add(new THREE.Vector3(0, 0, step)));
                } else {
                    // Diagonal
                    items.push(start, start.clone().add(new THREE.Vector3(step, 0, step)));
                }
            }
        }
        return items;
    }, [density, primaryColor, accentColor]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (materialRef.current) {
            materialRef.current.opacity = 0.2 + Math.sin(t * 2) * 0.15;
        }
    });

    return (
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <lineSegments ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={lines.length}
                        array={new Float32Array(lines.flatMap(v => [v.x, v.y, v.z]))}
                        itemSize={3}
                        args={[new Float32Array(0), 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial
                    ref={materialRef}
                    color={primaryColor}
                    transparent
                    opacity={0.3}
                    linewidth={1}
                />
            </lineSegments>

            {/* Thicker "Main" Traces */}
            <gridHelper args={[40, 10, primaryColor, accentColor]} />
        </group>
    );
}
