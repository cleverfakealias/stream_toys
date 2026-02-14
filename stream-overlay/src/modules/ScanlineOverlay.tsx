import React from 'react';
import { CONFIG } from '../engine/config';

interface ScanlineOverlayProps {
    opacity?: number;
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({
    opacity = 0.05
}) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: `linear-gradient(
      to bottom,
      rgba(255,255,255,0),
      rgba(255,255,255,0) 50%,
      ${CONFIG.colors.scanline} 50%,
      ${CONFIG.colors.scanline}
    )`,
        backgroundSize: '100% 4px',
        opacity: opacity,
        zIndex: 10,
    };

    return <div style={style} />;
};
