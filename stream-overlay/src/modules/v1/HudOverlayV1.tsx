/**
 * V1 HUD Overlay — Minimal corner brackets + brand.
 * Tuned for the winter cinematic scene.
 */
export function HudOverlayV1() {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 50,
    fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
  };

  const cornerStyle = (top: boolean, left: boolean): React.CSSProperties => ({
    position: 'absolute',
    width: '36px',
    height: '36px',
    opacity: 0.1,
    ...(top ? { top: '2.5rem' } : { bottom: '2.5rem' }),
    ...(left ? { left: '2.5rem' } : { right: '2.5rem' }),
    borderTop: top ? '1px solid rgba(255,255,255,0.4)' : 'none',
    borderBottom: !top ? '1px solid rgba(255,255,255,0.4)' : 'none',
    borderLeft: left ? '1px solid rgba(255,255,255,0.4)' : 'none',
    borderRight: !left ? '1px solid rgba(255,255,255,0.4)' : 'none',
  });

  const brandStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '3rem',
    left: '5rem',
    opacity: 0.12,
    color: 'white',
  };

  return (
    <div style={containerStyle}>
      <div style={cornerStyle(true, true)} />
      <div style={cornerStyle(true, false)} />
      <div style={cornerStyle(false, true)} />
      <div style={cornerStyle(false, false)} />

      <div style={brandStyle}>
        <div
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            fontWeight: 600,
          }}
        >
          NORTHWOODS // CYBER STUDIO
        </div>
      </div>
    </div>
  );
}
