# Northwoods Cyber Studio Overlay

A production-ready animated stream background built with React Three Fiber.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## OBS Browser Source Setup

1. Add a **Browser Source** to your scene.
2. Set **URL** to:
   - Local: `http://localhost:5173/` (requires dev server running)
   - Production: Point to your deployed URL (e.g., Vercel/Netlify).
3. Set **Width**: `1920`
4. Set **Height**: `1080`
5. Check **Control audio via OBS** (optional, no audio currently).
6. **IMPORTANT**: Check **Shutdown source when not visible** to save resources.
7. **Refres browser when scene becomes active**: Recommended.

## Configuration (URL Parameters)

You can customize the overlay by appending query parameters to the URL:

| Parameter | Options | Default | Description |
|-----------|---------|---------|-------------|
| `preset` | `calm`, `hype`, `coding` | `calm` | General mood/speed. |
| `quality` | `low`, `medium`, `high` | `medium` | graphics quality. |
| `accent` | `forest`, `teal` | `forest` | Color theme. |
| `fps` | Number (e.g., `30`, `60`) | `30` | Target FPS cap. |

### Examples
- **High Quality Teal**: `http://localhost:5173/?quality=high&accent=teal`
- **Low Spec Machine**: `http://localhost:5173/?quality=low&fps=30`

## Performance

- **Low**: 1x pixel ratio, fewer particles, no post-processing.
- **Medium**: Up to 1.5x pixel ratio, standard particles.
- **High**: Up to 2x pixel ratio, max particles, scanline effects.
