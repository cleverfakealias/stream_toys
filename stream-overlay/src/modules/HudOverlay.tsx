import React from 'react';
import { CONFIG } from '../engine/config';
import type { ThemeAccent } from '../engine/types';

interface HudOverlayProps {
    accent: ThemeAccent;
    showBrand?: boolean;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
    accent,
    showBrand = true
}) => {
    const accentColor = accent === 'teal' ? CONFIG.colors.teal : CONFIG.colors.forest;

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20,
        color: CONFIG.colors.hud,
        fontFamily: 'monospace',
        padding: '2rem',
    };

    const brandStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: '2rem',
        left: '2rem',
        opacity: 0.6,
        borderLeft: `2px solid ${accentColor}`,
        paddingLeft: '1rem',
    };

    const decorStyle: React.CSSProperties = {
        position: 'absolute',
        top: '2rem',
        right: '2rem',
        opacity: 0.4,
        borderTop: `1px solid ${accentColor}`,
        width: '100px',
    };

    return (
        <div style={containerStyle}>
            {/* Decorative top-right line */}
            <div style={decorStyle} />

            {/* Brand Anchor */}
            {showBrand && (
                <div style={brandStyle}>
                    <div style={{ fontSize: '0.8rem', letterSpacing: '0.2rem' }}>ZENN // NORTHWOODS</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>SYSTEM.ONLINE</div>
                </div>
            )}
        </div>
    );
};
