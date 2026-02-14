import { useState, useEffect } from 'react';
import { FONT_PRESETS } from '../modules/TextOverlay';
import type { FontPreset } from '../modules/TextOverlay';
import {
    V1_PARAM_DEFAULTS,
    type V1Preset,
    type V1QualityMode,
    type V1ParticleEffect,
} from '../engine/configV1';
import {
    TECH_PARAM_DEFAULTS,
    TECH_PRESETS,
    type TechPreset,
    type TechQualityMode,
} from '../engine/configTech';
import {
    NEURAL_PARAM_DEFAULTS,
    NEURAL_PRESETS,
    type NeuralPreset,
} from '../engine/configNeural';
import {
    SNOW_PARAM_DEFAULTS,
    SNOW_PRESETS,
    type SnowPreset,
} from '../engine/configSnow';
import {
    COASTER_PARAM_DEFAULTS,
    COASTER_PRESETS,
    type CoasterPreset,
} from '../engine/configCoaster';
import { sendOverlayCommand, sendOverlayReset } from '../engine/overlayBridge';

type Theme = 'v1' | 'tech' | 'neural' | 'snow' | 'coaster';

interface OverlayConfig {
    theme: Theme;
    text: string;
    font: FontPreset;
    // V1 specific
    v1: {
        preset: V1Preset;
        quality: V1QualityMode;
        particles: V1ParticleEffect;
        exposure: number;
        fogFalloff: number;
        sunElevation: number;
        rayStrength: number;
        treeDepthTint: number;
    };
    // Tech specific
    tech: {
        preset: TechPreset;
        quality: TechQualityMode;
        circuitDensity: number;
        dataFlowSpeed: number;
        glowIntensity: number;
        componentComplexity: number;
        exposure: number;
        primaryColor: string;
        accentColor: string;
        backgroundColor: string;
    };
    // Neural specific
    neural: {
        preset: NeuralPreset;
        particleCount: number;
        particleSize: number;
        interactionRadius: number;
        speed: number;
        primaryColor: string;
        accentColor: string;
        backgroundColor: string;
        glowIntensity: number;
    };
    // Snow specific
    snow: {
        preset: SnowPreset;
        particleCount: number;
        flakeSize: number;
        fallSpeed: number;
        windStrength: number;
        rotationSpeed: number;
        fogDensity: number;
        glowIntensity: number;
        primaryColor: string;
        accentColor: string;
        backgroundColor: string;
    };
    // Coaster specific
    coaster: {
        preset: CoasterPreset;
        speed: number;
        glowIntensity: number;
        fireworkFrequency: number;
        fogDensity: number;
        cameraSmooth: number;
        trackColor: string;
        accentColor: string;
        backgroundColor: string;
    };
    fps: 30 | 60;
    debug: boolean;
}

const DEFAULT_CONFIG: OverlayConfig = {
    theme: 'v1',
    text: '',
    font: 'orbitron',
    v1: {
        preset: V1_PARAM_DEFAULTS.preset,
        quality: V1_PARAM_DEFAULTS.quality,
        particles: V1_PARAM_DEFAULTS.particles,
        exposure: V1_PARAM_DEFAULTS.exposure,
        fogFalloff: V1_PARAM_DEFAULTS.fogFalloff,
        sunElevation: V1_PARAM_DEFAULTS.sunElevation,
        rayStrength: V1_PARAM_DEFAULTS.rayStrength,
        treeDepthTint: V1_PARAM_DEFAULTS.treeDepthTint,
    },
    tech: {
        preset: TECH_PARAM_DEFAULTS.preset,
        quality: TECH_PARAM_DEFAULTS.quality,
        circuitDensity: TECH_PARAM_DEFAULTS.circuitDensity,
        dataFlowSpeed: TECH_PARAM_DEFAULTS.dataFlowSpeed,
        glowIntensity: TECH_PARAM_DEFAULTS.glowIntensity,
        componentComplexity: TECH_PARAM_DEFAULTS.componentComplexity,
        exposure: TECH_PARAM_DEFAULTS.exposure,
        primaryColor: TECH_PARAM_DEFAULTS.primaryColor,
        accentColor: TECH_PARAM_DEFAULTS.accentColor,
        backgroundColor: TECH_PARAM_DEFAULTS.backgroundColor,
    },
    neural: {
        preset: NEURAL_PARAM_DEFAULTS.preset,
        particleCount: NEURAL_PARAM_DEFAULTS.particleCount,
        particleSize: NEURAL_PARAM_DEFAULTS.particleSize,
        interactionRadius: NEURAL_PARAM_DEFAULTS.interactionRadius,
        speed: NEURAL_PARAM_DEFAULTS.speed,
        primaryColor: NEURAL_PARAM_DEFAULTS.primaryColor,
        accentColor: NEURAL_PARAM_DEFAULTS.accentColor,
        backgroundColor: NEURAL_PARAM_DEFAULTS.backgroundColor,
        glowIntensity: NEURAL_PARAM_DEFAULTS.glowIntensity,
    },
    snow: {
        preset: SNOW_PARAM_DEFAULTS.preset,
        particleCount: SNOW_PARAM_DEFAULTS.particleCount,
        flakeSize: SNOW_PARAM_DEFAULTS.flakeSize,
        fallSpeed: SNOW_PARAM_DEFAULTS.fallSpeed,
        windStrength: SNOW_PARAM_DEFAULTS.windStrength,
        rotationSpeed: SNOW_PARAM_DEFAULTS.rotationSpeed,
        fogDensity: SNOW_PARAM_DEFAULTS.fogDensity,
        glowIntensity: SNOW_PARAM_DEFAULTS.glowIntensity,
        primaryColor: SNOW_PARAM_DEFAULTS.primaryColor,
        accentColor: SNOW_PARAM_DEFAULTS.accentColor,
        backgroundColor: SNOW_PARAM_DEFAULTS.backgroundColor,
    },
    coaster: {
        preset: COASTER_PARAM_DEFAULTS.preset,
        speed: COASTER_PARAM_DEFAULTS.speed,
        glowIntensity: COASTER_PARAM_DEFAULTS.glowIntensity,
        fireworkFrequency: COASTER_PARAM_DEFAULTS.fireworkFrequency,
        fogDensity: COASTER_PARAM_DEFAULTS.fogDensity,
        cameraSmooth: COASTER_PARAM_DEFAULTS.cameraSmooth,
        trackColor: COASTER_PARAM_DEFAULTS.trackColor,
        accentColor: COASTER_PARAM_DEFAULTS.accentColor,
        backgroundColor: COASTER_PARAM_DEFAULTS.backgroundColor,
    },
    fps: 30,
    debug: false,
};

const THEMES: { key: Theme; label: string; icon: string }[] = [
    { key: 'v1', label: 'Winter Mountain', icon: '🏔️' },
    { key: 'tech', label: 'Tech Center', icon: '💻' },
    { key: 'neural', label: 'Neural Network', icon: '🧠' },
    { key: 'snow', label: 'Crystal Snow', icon: '❄️' },
    { key: 'coaster', label: 'Neon Coaster', icon: '🎢' },
];

const V1_PRESET_OPTIONS: { key: V1Preset; label: string; icon: string }[] = [
    { key: 'winterCinematic', label: 'Winter Cinematic', icon: '🏔️' },
    { key: 'broadcast', label: 'Broadcast', icon: '📡' },
    { key: 'minimal', label: 'Minimal', icon: '◽' },
];

const TECH_PRESET_OPTIONS: { key: TechPreset; label: string; icon: string }[] = [
    { key: 'Mainframe', label: 'Mainframe', icon: '🎛️' },
    { key: 'Cyberdeck', label: 'Cyberdeck', icon: '⌨️' },
    { key: 'DeepNet', label: 'DeepNet', icon: '🕸️' },
];

const NEURAL_PRESET_OPTIONS: { key: NeuralPreset; label: string; icon: string }[] = [
    { key: 'Synapse', label: 'Synapse', icon: '🧠' },
    { key: 'Ghost', label: 'Ghost', icon: '👻' },
    { key: 'Void', label: 'Void', icon: '🌑' },
];

const V1_KNOBS: { key: keyof OverlayConfig['v1']; label: string; desc: string }[] = [
    { key: 'exposure', label: 'Exposure', desc: 'Midtone readability' },
    { key: 'fogFalloff', label: 'Fog Falloff', desc: 'Depth separation' },
    { key: 'sunElevation', label: 'Sun Elevation', desc: 'Ray angle' },
    { key: 'rayStrength', label: 'Ray Strength', desc: 'Cinematic rays' },
    { key: 'treeDepthTint', label: 'Tree Tint', desc: 'FG vs BG realism' },
];

const TECH_KNOBS: { key: keyof OverlayConfig['tech']; label: string; desc: string }[] = [
    { key: 'circuitDensity', label: 'Circuit Density', desc: 'Trace line volume' },
    { key: 'dataFlowSpeed', label: 'Data Speed', desc: 'Flow animation rate' },
    { key: 'glowIntensity', label: 'Glow/Bloom', desc: 'Neon brightness' },
    { key: 'componentComplexity', label: 'Density', desc: 'Component count' },
    { key: 'exposure', label: 'Exposure', desc: 'Overall brightness' },
];

const NEURAL_KNOBS: { key: keyof OverlayConfig['neural']; label: string; desc: string }[] = [
    { key: 'particleCount', label: 'Particles', desc: 'Total points' },
    { key: 'particleSize', label: 'Size', desc: 'Point diameter' },
    { key: 'interactionRadius', label: 'Radius', desc: 'Hover effect range' },
    { key: 'speed', label: 'Speed', desc: 'Motion rate' },
    { key: 'glowIntensity', label: 'Glow', desc: 'Bloom brightness' },
];

const SNOW_PRESET_OPTIONS: { key: SnowPreset; label: string; icon: string }[] = [
    { key: 'Gentle', label: 'Gentle', icon: '🌨️' },
    { key: 'Blizzard', label: 'Blizzard', icon: '🌪️' },
    { key: 'Arctic', label: 'Arctic', icon: '🧊' },
];

const SNOW_KNOBS: { key: keyof OverlayConfig['snow']; label: string; desc: string }[] = [
    { key: 'particleCount', label: 'Flakes', desc: 'Total snowflakes' },
    { key: 'flakeSize', label: 'Size', desc: 'Crystal size' },
    { key: 'fallSpeed', label: 'Fall Speed', desc: 'Descent rate' },
    { key: 'windStrength', label: 'Wind', desc: 'Drift intensity' },
    { key: 'rotationSpeed', label: 'Rotation', desc: 'Layer spin speed' },
    { key: 'glowIntensity', label: 'Glow', desc: 'Bloom brightness' },
];

const COASTER_PRESET_OPTIONS: { key: CoasterPreset; label: string; icon: string }[] = [
    { key: 'NeonNight', label: 'Neon Night', icon: '🌃' },
    { key: 'Cyberpunk', label: 'Cyberpunk', icon: '⚡' },
    { key: 'Void', label: 'Void', icon: '🌑' },
];

const COASTER_KNOBS: { key: keyof OverlayConfig['coaster']; label: string; desc: string }[] = [
    { key: 'speed', label: 'Speed', desc: 'Ride velocity' },
    { key: 'glowIntensity', label: 'Glow', desc: 'Neon bloom' },
    { key: 'fireworkFrequency', label: 'Fireworks', desc: 'Burst frequency' },
    { key: 'fogDensity', label: 'Fog', desc: 'Atmosphere density' },
    { key: 'cameraSmooth', label: 'Smoothing', desc: 'Camera lerp' },
];

const V1_PARTICLE_OPTIONS: { key: V1ParticleEffect; label: string; icon: string }[] = [
    { key: 'snow', label: 'Snow', icon: '❄️' },
    { key: 'fireflies', label: 'Fireflies', icon: '✨' },
    { key: 'rain', label: 'Rain', icon: '🌧️' },
    { key: 'dust', label: 'Dust', icon: '💨' },
    { key: 'embers', label: 'Embers', icon: '🔥' },
    { key: 'stars', label: 'Stars', icon: '⭐' },
    { key: 'none', label: 'None', icon: '◽' },
];

export function ConfigPage() {
    const [config, setConfig] = useState<OverlayConfig>(DEFAULT_CONFIG);
    const [copied, setCopied] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('overlayConfig_v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig({ ...DEFAULT_CONFIG, ...parsed });
            } catch {
                console.error('Failed to parse saved config');
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('overlayConfig_v2', JSON.stringify(config));
    }, [config]);

    const generateUrl = () => {
        const baseUrl = window.location.origin;
        const params = new URLSearchParams();
        if (config.text) params.set('text', config.text);
        if (config.font !== 'orbitron') params.set('font', config.font);

        if (config.theme === 'v1') {
            const v1 = config.v1;
            if (v1.preset !== V1_PARAM_DEFAULTS.preset) params.set('preset', v1.preset);
            if (v1.quality !== V1_PARAM_DEFAULTS.quality) params.set('quality', v1.quality);
            if (v1.particles !== V1_PARAM_DEFAULTS.particles) params.set('particles', v1.particles);
            params.set('exposure', String(v1.exposure));
            params.set('fogFalloff', String(v1.fogFalloff));
            params.set('sunElevation', String(v1.sunElevation));
            params.set('rayStrength', String(v1.rayStrength));
            params.set('treeDepthTint', String(v1.treeDepthTint));
        } else if (config.theme === 'tech') {
            const tech = config.tech;
            if (tech.preset !== TECH_PARAM_DEFAULTS.preset) params.set('preset', tech.preset);
            if (tech.quality !== TECH_PARAM_DEFAULTS.quality) params.set('quality', tech.quality);
            params.set('circuitDensity', String(tech.circuitDensity));
            params.set('dataFlowSpeed', String(tech.dataFlowSpeed));
            params.set('glowIntensity', String(tech.glowIntensity));
            params.set('componentComplexity', String(tech.componentComplexity));
            params.set('exposure', String(tech.exposure));
            params.set('primaryColor', tech.primaryColor);
            params.set('accentColor', tech.accentColor);
            params.set('backgroundColor', tech.backgroundColor);
        } else if (config.theme === 'neural') {
            const neural = config.neural;
            if (neural.preset !== NEURAL_PARAM_DEFAULTS.preset) params.set('preset', neural.preset);
            params.set('particleCount', String(neural.particleCount));
            params.set('particleSize', String(neural.particleSize));
            params.set('interactionRadius', String(neural.interactionRadius));
            params.set('speed', String(neural.speed));
            params.set('glowIntensity', String(neural.glowIntensity));
            params.set('primaryColor', neural.primaryColor);
            params.set('accentColor', neural.accentColor);
            params.set('backgroundColor', neural.backgroundColor);
        } else if (config.theme === 'snow') {
            const snow = config.snow;
            if (snow.preset !== SNOW_PARAM_DEFAULTS.preset) params.set('preset', snow.preset);
            params.set('particleCount', String(snow.particleCount));
            params.set('flakeSize', String(snow.flakeSize));
            params.set('fallSpeed', String(snow.fallSpeed));
            params.set('windStrength', String(snow.windStrength));
            params.set('rotationSpeed', String(snow.rotationSpeed));
            params.set('fogDensity', String(snow.fogDensity));
            params.set('glowIntensity', String(snow.glowIntensity));
            params.set('primaryColor', snow.primaryColor);
            params.set('accentColor', snow.accentColor);
            params.set('backgroundColor', snow.backgroundColor);
        } else if (config.theme === 'coaster') {
            const c = config.coaster;
            if (c.preset !== COASTER_PARAM_DEFAULTS.preset) params.set('preset', c.preset);
            params.set('speed', String(c.speed));
            params.set('glowIntensity', String(c.glowIntensity));
            params.set('fireworkFrequency', String(c.fireworkFrequency));
            params.set('fogDensity', String(c.fogDensity));
            params.set('cameraSmooth', String(c.cameraSmooth));
            params.set('trackColor', c.trackColor);
            params.set('accentColor', c.accentColor);
            params.set('backgroundColor', c.backgroundColor);
        }

        if (config.fps !== 30) params.set('fps', String(config.fps));
        if (config.debug) params.set('debug', '1');

        const qs = params.toString();
        return `${baseUrl}/${config.theme}${qs ? '?' + qs : ''}`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateUrl());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Live update preview via BroadcastChannel whenever config changes
    useEffect(() => {
        const payload =
            config.theme === 'v1' ? {
                particles: config.v1.particles,
                text: config.text || undefined,
                exposure: config.v1.exposure,
                fogFalloff: config.v1.fogFalloff,
                sunElevation: config.v1.sunElevation,
                rayStrength: config.v1.rayStrength,
                treeDepthTint: config.v1.treeDepthTint,
            } : config.theme === 'tech' ? {
                text: config.text || undefined,
                circuitDensity: config.tech.circuitDensity,
                dataFlowSpeed: config.tech.dataFlowSpeed,
                glowIntensity: config.tech.glowIntensity,
                componentComplexity: config.tech.componentComplexity,
                exposure: config.tech.exposure,
                primaryColor: config.tech.primaryColor,
                accentColor: config.tech.accentColor,
                backgroundColor: config.tech.backgroundColor,
            } : config.theme === 'neural' ? {
                text: config.text || undefined,
                particleCount: config.neural.particleCount,
                particleSize: config.neural.particleSize,
                interactionRadius: config.neural.interactionRadius,
                speed: config.neural.speed,
                glowIntensity: config.neural.glowIntensity,
                primaryColor: config.neural.primaryColor,
                accentColor: config.neural.accentColor,
                backgroundColor: config.neural.backgroundColor,
            } : config.theme === 'snow' ? {
                text: config.text || undefined,
                particleCount: config.snow.particleCount,
                flakeSize: config.snow.flakeSize,
                fallSpeed: config.snow.fallSpeed,
                windStrength: config.snow.windStrength,
                rotationSpeed: config.snow.rotationSpeed,
                fogDensity: config.snow.fogDensity,
                glowIntensity: config.snow.glowIntensity,
                primaryColor: config.snow.primaryColor,
                accentColor: config.snow.accentColor,
                backgroundColor: config.snow.backgroundColor,
            } : {
                text: config.text || undefined,
                speed: config.coaster.speed,
                glowIntensity: config.coaster.glowIntensity,
                fireworkFrequency: config.coaster.fireworkFrequency,
                fogDensity: config.coaster.fogDensity,
                cameraSmooth: config.coaster.cameraSmooth,
                trackColor: config.coaster.trackColor,
                accentColor: config.coaster.accentColor,
                backgroundColor: config.coaster.backgroundColor,
            };

        sendOverlayCommand(payload as any);
    }, [config]);

    const previewUrl = generateUrl();

    // Use state to keep iframeSrc stable across slider changes
    const [stableIframeSrc, setStableIframeSrc] = useState('');

    useEffect(() => {
        const url = generateUrl();
        const urlObj = new URL(url);
        const search = urlObj.search;
        const src = `${window.location.origin}/${config.theme}${search}${search.includes('?') ? '&' : '?'}preview=1&__k=${previewKey}`;
        setStableIframeSrc(src);
    }, [config.theme, config.font, previewKey]);

    const setV1Knob = (key: keyof OverlayConfig['v1'], value: number) => {
        const clamped = Math.max(0, Math.min(1, value));
        setConfig((prev) => ({
            ...prev,
            v1: { ...prev.v1, [key]: Math.round(clamped * 100) / 100 }
        }));
    };

    const setTechKnob = (key: keyof OverlayConfig['tech'], value: number) => {
        const clamped = Math.max(0, Math.min(1, value));
        setConfig((prev) => ({
            ...prev,
            tech: { ...prev.tech, [key]: Math.round(clamped * 100) / 100 }
        }));
    };

    const setNeuralKnob = (key: keyof OverlayConfig['neural'], value: number) => {
        // Some neural knobs have different ranges, but for now we'll stick to 0..1 generic if possible
        // or handle specific ones
        let finalVal = value;
        if (key === 'particleCount') finalVal = Math.round(value * 20000);
        if (key === 'particleSize') finalVal = Math.round(value * 5 * 10) / 10;
        if (key === 'interactionRadius') finalVal = Math.round(value * 10 * 10) / 10;
        if (key === 'speed') finalVal = Math.round(value * 4 * 10) / 10;
        if (key === 'glowIntensity') finalVal = Math.round(value * 2 * 10) / 10;

        setConfig((prev) => ({
            ...prev,
            neural: { ...prev.neural, [key]: finalVal }
        }));
    };

    const setSnowKnob = (key: keyof OverlayConfig['snow'], value: number) => {
        let finalVal = value;
        if (key === 'particleCount') finalVal = Math.round(value * 10000);
        if (key === 'flakeSize') finalVal = Math.round(value * 15 * 10) / 10;
        if (key === 'fallSpeed') finalVal = Math.round(value * 4 * 10) / 10;
        if (key === 'windStrength') finalVal = Math.round(value * 3 * 10) / 10;
        if (key === 'rotationSpeed') finalVal = Math.round(value * 1 * 10) / 10;
        if (key === 'glowIntensity') finalVal = Math.round(value * 2 * 10) / 10;

        setConfig((prev) => ({
            ...prev,
            snow: { ...prev.snow, [key]: finalVal }
        }));
    };

    const setCoasterKnob = (key: keyof OverlayConfig['coaster'], value: number) => {
        let finalVal = value;
        if (key === 'speed') finalVal = Math.round(value * 3 * 10) / 10;
        if (key === 'glowIntensity') finalVal = Math.round(value * 2 * 10) / 10;
        if (key === 'fireworkFrequency') finalVal = Math.round(value * 1 * 10) / 10;
        if (key === 'fogDensity') finalVal = Math.round(value * 0.02 * 1000) / 1000;
        if (key === 'cameraSmooth') finalVal = Math.round(value * 1 * 10) / 10;

        setConfig((prev) => ({
            ...prev,
            coaster: { ...prev.coaster, [key]: finalVal }
        }));
    };

    return (
        <div style={S.shell}>
            {/* ── LEFT: Preview Panel ──────────────────────────── */}
            <div style={S.previewPanel}>
                <header style={S.header}>
                    <h1 style={S.title}>Northwoods Studio</h1>
                    <p style={S.subtitle}>
                        {config.theme === 'v1' ? 'Winter Mountain Cinematic' :
                            config.theme === 'tech' ? 'Tech Center Realism' :
                                config.theme === 'neural' ? 'Interactive Neural Network' :
                                    config.theme === 'snow' ? 'Crystal Snowfall' :
                                        'Neon Rollercoaster Ride'}
                    </p>
                </header>

                <div style={S.previewWrap}>
                    <div style={S.previewHeader}>
                        <span style={S.previewLabel}>Live Preview</span>
                        <button onClick={() => setPreviewKey((k) => k + 1)} style={S.refreshBtn}>↻ Refresh</button>
                    </div>
                    <div style={S.aspect16x9}>
                        <iframe key={config.theme + config.font} src={stableIframeSrc} style={S.iframe} title="Overlay Preview" />
                    </div>
                </div>

                <div style={S.urlSection}>
                    <label style={S.label}>OBS Browser Source URL</label>
                    <div style={S.urlBox}>
                        <code style={S.urlCode}>{previewUrl}</code>
                    </div>
                    <div style={S.btnRow}>
                        <button onClick={copyToClipboard} style={S.primaryBtn}>{copied ? '✓ Copied!' : 'Copy URL'}</button>
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={S.secondaryBtn}>Preview ↗</a>
                    </div>
                    <div style={S.btnRow}>
                        <button
                            onClick={() => {
                                // Explicitly send the same payload as live update, but for external listeners
                                sendOverlayCommand({ text: config.text } as any);
                            }}
                            style={{ ...S.primaryBtn, background: 'linear-gradient(90deg, #ff4444, #ff6644)' }}
                        >
                            Push Live ⚡
                        </button>
                        <button onClick={() => sendOverlayReset()} style={S.secondaryBtn}>Reset ↺</button>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Settings Panel ────────────────────────── */}
            <div style={S.settingsPanel}>
                <section style={S.card}>
                    <h2 style={S.cardTitle}>Theme Selection</h2>
                    <div style={S.grid2}>
                        {THEMES.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setConfig({ ...config, theme: t.key })}
                                style={{ ...S.chip, ...(config.theme === t.key ? S.chipActive : {}) }}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section style={S.card}>
                    <h2 style={S.cardTitle}>Content</h2>
                    <div style={S.field}>
                        <label style={S.label}>Display Text</label>
                        <input
                            type="text"
                            value={config.text}
                            onChange={(e) => setConfig({ ...config, text: e.target.value })}
                            placeholder="e.g., Starting Soon"
                            style={S.input}
                        />
                    </div>
                    <div style={S.field}>
                        <label style={S.label}>Font Style</label>
                        <div style={S.grid2}>
                            {(Object.keys(FONT_PRESETS) as FontPreset[]).map((fk) => (
                                <button
                                    key={fk}
                                    onClick={() => setConfig({ ...config, font: fk })}
                                    style={{ ...S.chip, ...(config.font === fk ? S.chipFont : {}) }}
                                >
                                    {FONT_PRESETS[fk].name}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {config.theme === 'v1' ? (
                    <>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Scene Settings (V1)</h2>
                            <div style={S.field}>
                                <label style={S.label}>Preset</label>
                                <div style={S.grid3}>
                                    {V1_PRESET_OPTIONS.map((o) => (
                                        <button
                                            key={o.key}
                                            onClick={() => setConfig({ ...config, v1: { ...config.v1, preset: o.key } })}
                                            style={{ ...S.chip, ...(config.v1.preset === o.key ? S.chipActive : {}) }}
                                        >
                                            {o.icon} {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={S.field}>
                                <label style={S.label}>Particles</label>
                                <div style={S.grid4}>
                                    {V1_PARTICLE_OPTIONS.map((o) => (
                                        <button
                                            key={o.key}
                                            onClick={() => setConfig({ ...config, v1: { ...config.v1, particles: o.key } })}
                                            style={{ ...S.chipParticle, ...(config.v1.particles === o.key ? S.chipParticleActive : {}) }}
                                        >
                                            <span>{o.icon}</span>{o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>V1 Tuning</h2>
                            {V1_KNOBS.map((k) => (
                                <div key={k.key} style={S.sliderRow}>
                                    <div style={S.sliderHead}>
                                        <span style={S.sliderLabel}>{k.label}</span>
                                        <span style={S.sliderVal}>{(config.v1[k.key] as number).toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.01" value={config.v1[k.key]} onChange={(e) => setV1Knob(k.key, parseFloat(e.target.value))} style={S.slider} />
                                    <span style={S.sliderDesc}>{k.desc}</span>
                                </div>
                            ))}
                        </section>
                    </>
                ) : config.theme === 'tech' ? (
                    <>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Scene Settings (Tech)</h2>
                            <div style={S.field}>
                                <label style={S.label}>Preset</label>
                                <div style={S.grid3}>
                                    {TECH_PRESET_OPTIONS.map((o) => (
                                        <button
                                            key={o.key}
                                            onClick={() => {
                                                const presetVals = TECH_PRESETS[o.key] || {};
                                                setConfig({
                                                    ...config,
                                                    tech: {
                                                        ...config.tech,
                                                        ...presetVals,
                                                        preset: o.key
                                                    }
                                                });
                                            }}
                                            style={{ ...S.chip, ...(config.tech.preset === o.key ? S.chipActive : {}) }}
                                        >
                                            {o.icon} {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Tech Tuning</h2>
                            {TECH_KNOBS.map((k) => (
                                <div key={k.key} style={S.sliderRow}>
                                    <div style={S.sliderHead}>
                                        <span style={S.sliderLabel}>{k.label}</span>
                                        <span style={S.sliderVal}>{(config.tech[k.key] as number).toFixed(2)}</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.01" value={config.tech[k.key]} onChange={(e) => setTechKnob(k.key, parseFloat(e.target.value))} style={S.slider} />
                                    <span style={S.sliderDesc}>{k.desc}</span>
                                </div>
                            ))}
                        </section>
                    </>
                ) : config.theme === 'neural' ? (
                    <>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Scene Settings (Neural)</h2>
                            <div style={S.field}>
                                <label style={S.label}>Preset</label>
                                <div style={S.grid3}>
                                    {NEURAL_PRESET_OPTIONS.map((o) => (
                                        <button
                                            key={o.key}
                                            onClick={() => {
                                                const presetVals = NEURAL_PRESETS[o.key] || {};
                                                setConfig({
                                                    ...config,
                                                    neural: {
                                                        ...config.neural,
                                                        ...presetVals,
                                                        preset: o.key
                                                    }
                                                });
                                            }}
                                            style={{ ...S.chip, ...(config.neural.preset === o.key ? S.chipActive : {}) }}
                                        >
                                            {o.icon} {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Neural Tuning</h2>
                            {NEURAL_KNOBS.map((k) => {
                                const val = config.neural[k.key];
                                let sliderVal = typeof val === 'number' ? val : 0;
                                if (k.key === 'particleCount') sliderVal = sliderVal / 20000;
                                if (k.key === 'particleSize') sliderVal = sliderVal / 5;
                                if (k.key === 'interactionRadius') sliderVal = sliderVal / 10;
                                if (k.key === 'speed') sliderVal = sliderVal / 4;
                                if (k.key === 'glowIntensity') sliderVal = sliderVal / 2;

                                return (
                                    <div key={k.key} style={S.sliderRow}>
                                        <div style={S.sliderHead}>
                                            <span style={S.sliderLabel}>{k.label}</span>
                                            <span style={S.sliderVal}>{typeof val === 'number' ? val.toFixed(k.key === 'particleCount' ? 0 : 1) : val}</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={sliderVal} onChange={(e) => setNeuralKnob(k.key, parseFloat(e.target.value))} style={S.slider} />
                                        <span style={S.sliderDesc}>{k.desc}</span>
                                    </div>
                                );
                            })}
                        </section>
                    </>
                ) : config.theme === 'snow' ? (
                    <>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Scene Settings (Snow)</h2>
                            <div style={S.field}>
                                <label style={S.label}>Preset</label>
                                <div style={S.grid3}>
                                    {SNOW_PRESET_OPTIONS.map((o) => (
                                        <button
                                            key={o.key}
                                            onClick={() => {
                                                const presetVals = SNOW_PRESETS[o.key] || {};
                                                setConfig({
                                                    ...config,
                                                    snow: {
                                                        ...config.snow,
                                                        ...presetVals,
                                                        preset: o.key
                                                    }
                                                });
                                            }}
                                            style={{ ...S.chip, ...(config.snow.preset === o.key ? S.chipActive : {}) }}
                                        >
                                            {o.icon} {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Snow Tuning</h2>
                            {SNOW_KNOBS.map((k) => {
                                const val = config.snow[k.key];
                                let sliderVal = typeof val === 'number' ? val : 0;
                                if (k.key === 'particleCount') sliderVal = sliderVal / 10000;
                                if (k.key === 'flakeSize') sliderVal = sliderVal / 15;
                                if (k.key === 'fallSpeed') sliderVal = sliderVal / 4;
                                if (k.key === 'windStrength') sliderVal = sliderVal / 3;
                                if (k.key === 'rotationSpeed') sliderVal = sliderVal / 1;
                                if (k.key === 'glowIntensity') sliderVal = sliderVal / 2;

                                return (
                                    <div key={k.key} style={S.sliderRow}>
                                        <div style={S.sliderHead}>
                                            <span style={S.sliderLabel}>{k.label}</span>
                                            <span style={S.sliderVal}>{typeof val === 'number' ? val.toFixed(k.key === 'particleCount' ? 0 : 1) : val}</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={sliderVal} onChange={(e) => setSnowKnob(k.key, parseFloat(e.target.value))} style={S.slider} />
                                        <span style={S.sliderDesc}>{k.desc}</span>
                                    </div>
                                );
                            })}
                        </section>
                    </>
                ) : (
                    <>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Scene Settings (Coaster)</h2>
                            <div style={S.field}>
                                <label style={S.label}>Preset</label>
                                <div style={S.grid3}>
                                    {COASTER_PRESET_OPTIONS.map((o) => (
                                        <button
                                            key={o.key}
                                            onClick={() => {
                                                const presetVals = COASTER_PRESETS[o.key] || {};
                                                setConfig({
                                                    ...config,
                                                    coaster: {
                                                        ...config.coaster,
                                                        ...presetVals,
                                                        preset: o.key
                                                    }
                                                });
                                            }}
                                            style={{ ...S.chip, ...(config.coaster.preset === o.key ? S.chipActive : {}) }}
                                        >
                                            {o.icon} {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section style={S.card}>
                            <h2 style={S.cardTitle}>Coaster Tuning</h2>
                            {COASTER_KNOBS.map((k) => {
                                const val = config.coaster[k.key];
                                let sliderVal = typeof val === 'number' ? val : 0;
                                if (k.key === 'speed') sliderVal = sliderVal / 3;
                                if (k.key === 'glowIntensity') sliderVal = sliderVal / 2;
                                if (k.key === 'fireworkFrequency') sliderVal = sliderVal / 1;
                                if (k.key === 'fogDensity') sliderVal = sliderVal / 0.02;
                                if (k.key === 'cameraSmooth') sliderVal = sliderVal / 1;

                                return (
                                    <div key={k.key} style={S.sliderRow}>
                                        <div style={S.sliderHead}>
                                            <span style={S.sliderLabel}>{k.label}</span>
                                            <span style={S.sliderVal}>{typeof val === 'number' ? val.toFixed(k.key === 'fogDensity' ? 3 : 1) : val}</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={sliderVal} onChange={(e) => setCoasterKnob(k.key, parseFloat(e.target.value))} style={S.slider} />
                                        <span style={S.sliderDesc}>{k.desc}</span>
                                    </div>
                                );
                            })}
                        </section>
                    </>
                )}

                <section style={S.card}>
                    <h2 style={S.cardTitle}>Options</h2>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label style={S.toggle}>
                            <input type="checkbox" checked={config.fps === 60} onChange={(e) => setConfig({ ...config, fps: e.target.checked ? 60 : 30 })} style={{ accentColor: '#ff8844' }} />
                            60 FPS
                        </label>
                        <label style={S.toggle}>
                            <input type="checkbox" checked={config.debug} onChange={(e) => setConfig({ ...config, debug: e.target.checked })} style={{ accentColor: '#ff8844' }} />
                            Debug Camera
                        </label>
                    </div>
                </section>
            </div>
        </div>
    );
}

const S: Record<string, React.CSSProperties> = {
    shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0c14', fontFamily: "'Segoe UI', sans-serif", color: '#e0e8f0' },
    previewPanel: { width: '58%', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem', borderRight: '1px solid #1f2937' },
    settingsPanel: { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    header: { textAlign: 'center' },
    title: { margin: 0, fontSize: '1.2rem', color: '#ff8844' },
    subtitle: { margin: 0, color: '#667788', fontSize: '0.75rem' },
    previewWrap: { flex: 1, display: 'flex', flexDirection: 'column' },
    previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' },
    previewLabel: { fontSize: '0.7rem', color: '#667788', textTransform: 'uppercase' },
    refreshBtn: { padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: '#1f2937', border: '1px solid #374151', color: '#8899aa', borderRadius: '4px' },
    aspect16x9: { flex: 1, position: 'relative', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' },
    iframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
    urlSection: { marginTop: '0.5rem' },
    urlBox: { background: '#000', padding: '0.5rem', borderRadius: '6px', maxHeight: '48px', overflow: 'auto' },
    urlCode: { fontSize: '0.65rem', color: '#88aacc' },
    btnRow: { display: 'flex', gap: '0.5rem', marginTop: '0.4rem' },
    primaryBtn: { flex: 1, padding: '0.45rem', fontSize: '0.8rem', background: '#ff8844', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: 'pointer' },
    secondaryBtn: { flex: 1, padding: '0.45rem', fontSize: '0.8rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#aabbcc', textAlign: 'center', textDecoration: 'none' },
    card: { background: '#111827', borderRadius: '10px', padding: '1rem', border: '1px solid #1f2937' },
    cardTitle: { margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#ff8844', textTransform: 'uppercase' },
    field: { marginBottom: '0.85rem' },
    label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#8899aa' },
    input: { width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #1f2937', color: '#fff', borderRadius: '6px' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' },
    chip: { padding: '0.4rem', fontSize: '0.7rem', background: '#1f2937', border: '1px solid #374151', color: '#8899aa', borderRadius: '4px', cursor: 'pointer' },
    chipActive: { background: 'rgba(255,136,68,0.2)', borderColor: '#ff8844', color: '#ff8844' },
    chipFont: { background: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6', color: '#60a5fa' },
    chipParticle: { padding: '0.35rem', fontSize: '0.6rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    chipParticleActive: { background: 'rgba(16,185,129,0.2)', borderColor: '#10b981', color: '#34d399' },
    sliderRow: { marginBottom: '0.6rem' },
    sliderHead: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' },
    sliderLabel: { fontSize: '0.7rem', color: '#b0b8c4' },
    sliderVal: { fontSize: '0.65rem', color: '#ff8844' },
    slider: { width: '100%', accentColor: '#ff8844' },
    sliderDesc: { fontSize: '0.55rem', color: '#4b5563' },
    toggle: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' },
};
