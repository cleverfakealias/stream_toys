import { useMemo } from 'react';
import * as THREE from 'three';

const PI2 = Math.PI * 2;

/**
 * Parametric rollercoaster curve — a Lissajous-style knot.
 * Produces a continuous looping 3D track.
 */
export function createCoasterCurve() {
    const vector = new THREE.Vector3();
    const vector2 = new THREE.Vector3();

    return {
        getPointAt(t: number): THREE.Vector3 {
            t = t * PI2;
            const x = Math.sin(t * 3) * Math.cos(t * 4) * 50;
            const y = Math.sin(t * 10) * 2 + Math.cos(t * 17) * 2 + 5;
            const z = Math.sin(t) * Math.sin(t * 4) * 50;
            return vector.set(x, y, z).multiplyScalar(2);
        },

        getTangentAt(t: number): THREE.Vector3 {
            const delta = 0.0001;
            const t1 = Math.max(0, t - delta);
            const t2 = Math.min(1, t + delta);
            return vector2
                .copy(this.getPointAt(t2))
                .sub(this.getPointAt(t1))
                .normalize();
        },
    };
}

type CurveType = ReturnType<typeof createCoasterCurve>;

/**
 * Generates neon tube geometry along the curve.
 * Two parallel rails with cross-ties, all as BufferGeometry.
 */
function buildTrackGeometry(curve: CurveType, divisions: number): THREE.BufferGeometry {
    const vertices: number[] = [];
    const colors: number[] = [];

    const up = new THREE.Vector3(0, 1, 0);
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    const point = new THREE.Vector3();
    const prevPoint = new THREE.Vector3();
    prevPoint.copy(curve.getPointAt(0));

    const quaternion = new THREE.Quaternion();
    const prevQuaternion = new THREE.Quaternion();
    prevQuaternion.setFromAxisAngle(up, Math.PI / 2);

    // Tube cross-section (hexagonal)
    const sides = 6;
    const tubeRadius = 0.12;
    const tubeShape: THREE.Vector3[] = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * PI2;
        tubeShape.push(
            new THREE.Vector3(
                Math.sin(angle) * tubeRadius,
                Math.cos(angle) * tubeRadius,
                0
            )
        );
    }

    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const v4 = new THREE.Vector3();

    function extrudeShape(
        shape: THREE.Vector3[],
        offset: THREE.Vector3,
        color: number[]
    ) {
        for (let j = 0; j < shape.length; j++) {
            const p1 = shape[j];
            const p2 = shape[(j + 1) % shape.length];

            v1.copy(p1).add(offset).applyQuaternion(quaternion).add(point);
            v2.copy(p2).add(offset).applyQuaternion(quaternion).add(point);
            v3.copy(p2).add(offset).applyQuaternion(prevQuaternion).add(prevPoint);
            v4.copy(p1).add(offset).applyQuaternion(prevQuaternion).add(prevPoint);

            vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v4.x, v4.y, v4.z);
            vertices.push(v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, v4.x, v4.y, v4.z);

            for (let n = 0; n < 6; n++) {
                colors.push(color[0], color[1], color[2]);
            }
        }
    }

    const offset = new THREE.Vector3();

    for (let i = 1; i <= divisions; i++) {
        point.copy(curve.getPointAt(i / divisions));

        up.set(0, 1, 0);
        forward.subVectors(point, prevPoint).normalize();
        right.crossVectors(up, forward).normalize();
        up.crossVectors(forward, right);

        const angle = Math.atan2(forward.x, forward.z);
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

        // Two rails
        extrudeShape(tubeShape, offset.set(0.4, 0, 0), [1, 1, 1]);
        extrudeShape(tubeShape, offset.set(-0.4, 0, 0), [1, 1, 1]);

        // Cross-ties every few segments
        if (i % 8 === 0) {
            const tieLen = 0.8;
            const tieHalf = 0.02;
            // Simple quad for the tie
            const r = new THREE.Vector3();
            r.set(1, 0, 0).applyQuaternion(quaternion);
            const u2 = new THREE.Vector3(0, 1, 0);

            const c = point.clone();
            const left = c.clone().add(r.clone().multiplyScalar(-tieLen / 2));
            const rr = c.clone().add(r.clone().multiplyScalar(tieLen / 2));
            const leftUp = left.clone().add(u2.clone().multiplyScalar(tieHalf));
            const rrUp = rr.clone().add(u2.clone().multiplyScalar(tieHalf));

            vertices.push(
                left.x, left.y, left.z,
                rr.x, rr.y, rr.z,
                leftUp.x, leftUp.y, leftUp.z,
            );
            vertices.push(
                rr.x, rr.y, rr.z,
                rrUp.x, rrUp.y, rrUp.z,
                leftUp.x, leftUp.y, leftUp.z,
            );
            for (let n = 0; n < 6; n++) colors.push(0.5, 0.5, 0.5);
        }

        prevPoint.copy(point);
        prevQuaternion.copy(quaternion);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(colors), 3)
    );
    geometry.computeVertexNormals();
    return geometry;
}

/**
 * Generates support struts from track down to the ground.
 */
function buildStrutsGeometry(curve: CurveType, count: number): THREE.BufferGeometry {
    const vertices: number[] = [];
    const strutWidth = 0.05;

    for (let i = 0; i < count; i++) {
        const t = i / count;
        const p = curve.getPointAt(t);
        if (p.y < 1) continue; // Skip near-ground points

        // Vertical line from point down to y=0
        const top = p.clone();
        const bottom = new THREE.Vector3(p.x, 0, p.z);

        vertices.push(
            top.x - strutWidth, top.y, top.z,
            top.x + strutWidth, top.y, top.z,
            bottom.x - strutWidth, bottom.y, bottom.z,
        );
        vertices.push(
            top.x + strutWidth, top.y, top.z,
            bottom.x + strutWidth, bottom.y, bottom.z,
            bottom.x - strutWidth, bottom.y, bottom.z,
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.computeVertexNormals();
    return geometry;
}

interface CoasterTrackProps {
    trackColor: string;
    accentColor: string;
}

/**
 * CoasterTrack — Renders the neon rollercoaster track and support struts.
 */
export function CoasterTrack({ trackColor, accentColor }: CoasterTrackProps) {
    const curve = useMemo(() => createCoasterCurve(), []);

    const trackGeom = useMemo(() => buildTrackGeometry(curve, 1500), [curve]);
    const strutsGeom = useMemo(() => buildStrutsGeometry(curve, 200), [curve]);

    return (
        <>
            {/* Main track rails */}
            <mesh geometry={trackGeom} frustumCulled={false}>
                <meshBasicMaterial
                    vertexColors
                    color={trackColor}
                    toneMapped={false}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Support struts */}
            <mesh geometry={strutsGeom} frustumCulled={false}>
                <meshBasicMaterial
                    color={accentColor}
                    transparent
                    opacity={0.3}
                    toneMapped={false}
                />
            </mesh>

            {/* Neon glow lights along the track */}
            <TrackLights curve={curve} color={trackColor} />
        </>
    );
}

/**
 * Point lights along the track for ambient neon illumination.
 */
function TrackLights({ curve, color }: { curve: CurveType; color: string }) {
    const positions = useMemo(() => {
        const pts: [number, number, number][] = [];
        for (let i = 0; i < 20; i++) {
            const p = curve.getPointAt(i / 20);
            pts.push([p.x, p.y + 1, p.z]);
        }
        return pts;
    }, [curve]);

    return (
        <>
            {positions.map((pos, i) => (
                <pointLight
                    key={i}
                    position={pos}
                    color={color}
                    intensity={3}
                    distance={30}
                    decay={2}
                />
            ))}
        </>
    );
}

