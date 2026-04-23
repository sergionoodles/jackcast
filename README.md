<div align="center">
  <h1>JackCast</h1>
  <p><em>A playful, relaxing weather companion that paints the forecast with personality.</em></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare">
  </p>
</div>

---

## What is JackCast?

JackCast is a **Progressive Web App** that reimagines the weather forecast as a cozy, visually immersive experience. Instead of sterile icons and plain numbers, every forecast is wrapped in a **hand-crafted, AI-generated painterly scene** starring a spirited Jack Russell Terrier reacting to the weather around them.

Whether it's a golden sunrise over rolling hills, a cozy snowfall under moonlight, or a playful dash through autumn rain, the background art shifts dynamically to match your local conditions and time of day. The result feels less like a utility and more like a little window into a living storybook.

## Features

- **Dynamic AI Art Backgrounds** — Every weather condition and time of day (morning, afternoon, evening, night) is paired with a unique, anime-inspired painterly illustration generated via the Venice.ai API. The art cycles daily so the view never gets stale.
- **Real-Time Weather Data** — Powered by the free [Open-Meteo](https://open-meteo.com/) API. No API keys needed for weather data.
- **Geolocation & Search** — Automatically detects your location, or search for any city worldwide.
- **Favorites** — Save your go-to locations for quick access.
- **Hourly & 7-Day Forecasts** — Scrollable hourly breakdown plus a clean daily outlook.
- **Air Quality Index** — Real-time AQI display right alongside the temperature.
- **PWA Ready** — Install JackCast to your home screen. Works offline with a service worker and responsive, mobile-first design.
- **Smooth Animations** — Polished transitions and micro-interactions powered by [Motion](https://motion.dev/).

## The Art Pipeline

The soul of JackCast lives in `scripts/cover-generator/`. This is a fully automated image generation pipeline that:

1. **Maps 28 weather codes** (from Open-Meteo WMO codes) into 5 visual categories: `clear`, `cloudy`, `rain`, `snow`, and `storm`.
2. **Combines 4 times of day** (morning, afternoon, evening, night) with category-specific lighting prompts.
3. **Generates 4 artistic variations per combination** across 4 distinct styles:
   - Abstract anime-inspired painterly illustration
   - Bold vibrant watercolor
   - Rich oil painting on canvas
   - Vibrant gouache matte painting
4. **Produces over 80 unique scenes** featuring a small Jack Russell Terrier reacting charmingly to each condition — basking in sun, trotting through drizzle, catching snowflakes, or bravely weathering a thunderstorm.

Run the generator with:

```bash
cd scripts/cover-generator
# Ensure VENICE_API_KEY is set in your environment
pnpm install
pnpm generate
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
| Weather API | Open-Meteo |
| Image Generation | Venice.ai API |
| Deployment | Cloudflare Workers (Wrangler) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [pnpm](https://pnpm.io/) (preferred package manager)

### Installation

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
pnpm build
```

### Deploying

```bash
pnpm deploy
```

This builds the project and deploys it to Cloudflare Workers using Wrangler.

## Project Structure

```
jackcast/
├── public/
│   ├── backgrounds/          # Generated weather art assets
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
├── scripts/
│   └── cover-generator/      # AI art generation pipeline
│       ├── config.json       # Prompt templates & weather mappings
│       └── generate.js       # Venice.ai image generation script
├── src/
│   ├── components/           # React UI components
│   ├── config/
│   │   └── backgrounds.ts    # Background asset resolution logic
│   ├── services/
│   │   └── weather.ts        # Open-Meteo API client
│   ├── App.tsx               # Main application shell
│   └── types.ts              # Shared TypeScript types
├── package.json
├── vite.config.ts
└── wrangler.jsonc            # Cloudflare Workers config
```

## Design Philosophy

JackCast was built on a simple idea: **weather apps don't have to be boring**. Most forecasts present data as efficiently as possible, but efficiency isn't the only metric that matters. By wrapping forecasts in generative art that reacts to real conditions, JackCast turns a daily habit into a small moment of delight.

The Jack Russell Terrier was chosen as the mascot because the breed embodies the app's spirit — energetic, curious, and ready for any weather.

## License

This project is open source. Feel free to fork, remix, and make it your own.

---

<div align="center">
  <p><sub>Built with curiosity, caffeine, and a very good dog.</sub></p>
</div>
