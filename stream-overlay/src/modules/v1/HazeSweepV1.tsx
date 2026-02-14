import { useState, useEffect } from 'react';
import { CONFIG_V1 } from '../../engine/configV1';

/**
 * V1 Haze Sweep — slow warm haze band sweeping across screen.
 * CSS overlay (not 3D) for cheap ambient motion.
 */
export function HazeSweepV1() {
  const cfg = CONFIG_V1.hazeSweep;
  const [position, setPosition] = useState(-cfg.width);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const triggerSweep = () => {
      setActive(true);
      setPosition(-cfg.width);

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / cfg.duration;
        if (progress < 1) {
          const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
          setPosition(-cfg.width + eased * (1 + cfg.width * 2));
          requestAnimationFrame(animate);
        } else {
          setActive(false);
        }
      };
      requestAnimationFrame(animate);
    };

    const initialTimeout = setTimeout(triggerSweep, 10000);
    const interval = setInterval(triggerSweep, cfg.interval);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [cfg]);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: `${position * 100}%`,
        width: `${cfg.width * 100}%`,
        height: '100%',
        background: `linear-gradient(90deg, transparent 0%, ${cfg.color} 30%, ${cfg.color} 70%, transparent 100%)`,
        opacity: cfg.opacity,
        pointerEvents: 'none',
        zIndex: 40,
        mixBlendMode: 'screen',
      }}
    />
  );
}
