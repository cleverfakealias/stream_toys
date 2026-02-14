import { forwardRef } from 'react';
import * as THREE from 'three';
import { CONFIG_V1 } from '../../engine/configV1';

interface SunLightSourceProps {
  sunElevation?: number; // 0..1 from query param
}

/**
 * V1 Sun Light Source
 * Invisible mesh positioned behind the mountain ridge.
 * Exists only to drive the GodRays post-processing effect via occlusion.
 * The visible sunset glow comes from the sky gradient + horizon haze,
 * NOT from this mesh. Opacity=0 keeps it invisible to the camera.
 * `sunElevation` controls Y position (ray angle / composition).
 */
export const SunLightSource = forwardRef<THREE.Mesh, SunLightSourceProps>(
  ({ sunElevation = 0.3 }, ref) => {
    const cfg = CONFIG_V1.sun;

    // Map sunElevation 0..1 → Y position: near horizon to above ridge
    const yPos = cfg.baseHeight + sunElevation * 6;

    return (
      <group position={[0, yPos, cfg.zDepth]}>
        {/* GodRays occlusion source — invisible to camera */}
        <mesh ref={ref} renderOrder={-1}>
          <sphereGeometry args={[cfg.coreSize, 32, 32]} />
          <meshBasicMaterial
            color={cfg.color}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={true}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  },
);

SunLightSource.displayName = 'SunLightSource';
