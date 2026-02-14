import { useMemo } from 'react';

// Font presets available for text overlay
export const FONT_PRESETS = {
    orbitron: {
        name: 'Orbitron',
        family: "'Orbitron', monospace",
        weight: 700,
        letterSpacing: '0.3em',
        import: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap',
    },
    rajdhani: {
        name: 'Rajdhani',
        family: "'Rajdhani', sans-serif",
        weight: 600,
        letterSpacing: '0.25em',
        import: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@600&display=swap',
    },
    audiowide: {
        name: 'Audiowide',
        family: "'Audiowide', cursive",
        weight: 400,
        letterSpacing: '0.15em',
        import: 'https://fonts.googleapis.com/css2?family=Audiowide&display=swap',
    },
    bebas: {
        name: 'Bebas Neue',
        family: "'Bebas Neue', sans-serif",
        weight: 400,
        letterSpacing: '0.2em',
        import: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    },
    exo: {
        name: 'Exo 2',
        family: "'Exo 2', sans-serif",
        weight: 700,
        letterSpacing: '0.2em',
        import: 'https://fonts.googleapis.com/css2?family=Exo+2:wght@700&display=swap',
    },
    teko: {
        name: 'Teko',
        family: "'Teko', sans-serif",
        weight: 600,
        letterSpacing: '0.15em',
        import: 'https://fonts.googleapis.com/css2?family=Teko:wght@600&display=swap',
    },
    iceland: {
        name: 'Iceland',
        family: "'Iceland', cursive",
        weight: 400,
        letterSpacing: '0.2em',
        import: 'https://fonts.googleapis.com/css2?family=Iceland&display=swap',
    },
    aldrich: {
        name: 'Aldrich',
        family: "'Aldrich', sans-serif",
        weight: 400,
        letterSpacing: '0.15em',
        import: 'https://fonts.googleapis.com/css2?family=Aldrich&display=swap',
    },
} as const;

export type FontPreset = keyof typeof FONT_PRESETS;

/**
 * TextOverlay - Displays centered text from URL params or live override
 * ?text=Hello&font=orbitron
 */
export function TextOverlay({ textOverride }: { textOverride?: string }) {
    const { text: urlText, font } = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const textParam = params.get('text') || '';
        const fontParam = (params.get('font') || 'orbitron') as FontPreset;
        return { text: textParam, font: fontParam };
    }, []);

    const text = textOverride !== undefined ? textOverride : urlText;

    // Load Google Font dynamically
    useMemo(() => {
        const preset = FONT_PRESETS[font] || FONT_PRESETS.orbitron;
        const linkId = `font-${font}`;

        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = preset.import;
            document.head.appendChild(link);
        }
    }, [font]);

    if (!text) return null;

    const preset = FONT_PRESETS[font] || FONT_PRESETS.orbitron;

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 100,
    };

    const textStyle: React.CSSProperties = {
        fontFamily: preset.family,
        fontSize: 'clamp(3rem, 8vw, 6rem)',
        fontWeight: preset.weight,
        color: 'rgba(255, 255, 255, 0.9)',
        textTransform: 'uppercase',
        letterSpacing: preset.letterSpacing,
        textShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 80px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        padding: '0 2rem',
    };

    return (
        <div style={containerStyle}>
            <div style={textStyle}>{text}</div>
        </div>
    );
}
