import { useMemo } from 'react';
import * as THREE from 'three';
import { CONFIG_V1 } from '../../engine/configV1';

/**
 * V1 Foothill Transition Layer
 * Rolling midground hills bridging mountains to foreground forest.
 */
export function FoothillTransitionLayer({ segments = 80 }: { segments?: number }) {
  const cfg = CONFIG_V1.foothills;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    const indices: number[] = [];

    const halfW = cfg.width / 2;
    const baseY = -15;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -halfW + t * cfg.width;

      let h = 0;
      h += Math.sin(t * Math.PI * 3.2 + 0.5) * cfg.height * 0.5;
      h += Math.sin(t * Math.PI * 7.1 + 1.2) * cfg.height * 0.2 * cfg.undulation;
      h += Math.sin(t * Math.PI * 13.0 + 2.8) * cfg.height * 0.08;
      h += cfg.height * 0.3;

      const edgeFade = Math.pow(Math.sin(t * Math.PI), 0.6);
      h *= edgeFade;
      h = Math.max(h, 0.2);

      verts.push(x, h, cfg.zDepth);
      verts.push(x, baseY, cfg.zDepth);
    }

    for (let i = 0; i < segments; i++) {
      const tl = i * 2;
      const bl = i * 2 + 1;
      const tr = (i + 1) * 2;
      const br = (i + 1) * 2 + 1;
      indices.push(tl, bl, tr);
      indices.push(tr, bl, br);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [cfg, segments]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(cfg.color),
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    [cfg.color],
  );

  return <mesh geometry={geometry} material={material} />;
}
