import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function DataFlow({ speed = 0.5, intensity = 0.5, accentColor = '#ff00ff' }: any) {
    const count = 40;
    const meshRef = useRef<THREE.InstancedMesh>(null!);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 30,
                z: (Math.random() - 0.5) * 30,
                speed: (0.05 + Math.random() * 0.1) * speed,
                offset: Math.random() * Math.PI * 2
            });
        }
        return temp;
    }, [speed, accentColor]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();

        particles.forEach((p, i) => {
            const y = Math.max(0.05, Math.sin(time * p.speed + p.offset) * 0.2);
            dummy.position.set(p.x, y, p.z);
            dummy.scale.setScalar(0.1 + Math.sin(time + p.offset) * 0.05);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial
                color={accentColor}
                emissive={accentColor}
                emissiveIntensity={6 * intensity}
                transparent
                opacity={0.9}
            />
        </instancedMesh>
    );
}
