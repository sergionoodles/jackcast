import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "https://api.venice.ai/api/v1/image/generate";
const OUTPUT_DIR = path.join(__dirname, "../../public/backgrounds");
const OUTPUT_EXT = "jpeg";

const WEATHER_TO_CATEGORY = {
  "clear-sky": "clear",
  "mainly-clear": "clear",
  "partly-cloudy": "cloudy",
  overcast: "cloudy",
  fog: "cloudy",
  "depositing-rime-fog": "cloudy",
  "light-drizzle": "rain",
  "moderate-drizzle": "rain",
  "dense-drizzle": "rain",
  "light-freezing-drizzle": "rain",
  "dense-freezing-drizzle": "rain",
  "slight-rain": "rain",
  "moderate-rain": "rain",
  "heavy-rain": "rain",
  "light-freezing-rain": "rain",
  "heavy-freezing-rain": "rain",
  "slight-snow-fall": "snow",
  "moderate-snow-fall": "snow",
  "heavy-snow-fall": "snow",
  "snow-grains": "snow",
  "slight-rain-showers": "rain",
  "moderate-rain-showers": "rain",
  "violent-rain-showers": "rain",
  "slight-snow-showers": "snow",
  "heavy-snow-showers": "snow",
  thunderstorm: "storm",
  "thunderstorm-with-slight-hail": "storm",
  "thunderstorm-with-heavy-hail": "storm",
};

const MODEL = process.env.VENICE_MODEL || "qwen-image";
const API_KEY = process.env.VENICE_API_KEY;

const AESTHETIC_DIRECTION =
  "Overall art direction: pure surreal nostalgic illustration, abstract weather shapes, soft-focus edges, hazy analog color, imperfect hand-drawn forms, visible brush texture, dreamlike storybook mood. Keep the dog charming, loosely rendered, and non-literal with simplified anatomy.";

const STYLES = [
  "Surreal anime-inspired painterly illustration, loose sweeping brushstrokes, softened ink lines, luminous hazy glow, abstract sky gradients, nostalgic color, visible handmade texture, dreamlike weather-cover mood",
  "Washed watercolor storybook illustration, saturated pigment blooms, wet-on-wet bleeding, visible paper grain, soft unresolved edges, colors drifting into one another, abstract environment, nostalgic rainy-day sketchbook feeling",
  "Dreamlike oil-pastel painting, smeared color glazes, soft impasto-like texture, blurred light and shadow, imperfect handmade shapes, warm-cool haze, old illustrated book atmosphere",
  "Matte gouache folk illustration, thick opaque brush shapes, simplified abstract forms, softened color contrasts, charming imperfect mascot design, whimsical nostalgic cover art",
  "Expressive ink-and-wash fantasy illustration, loose black linework, translucent color washes, atmospheric fog, textured paper grain, elegant negative space, symbolic weather effects, softly rendered character",
  "Layered storybook poster art, bold gouache shapes, hand-painted texture, softened silhouette design, rich but slightly faded color blocking, charming editorial illustration mood, abstract scenery",
  "Soft pastel and chalk animation background art, velvety grain, luminous color fields, smudged edges, hazy environmental lighting, expressive hand-drawn marks, warm whimsical memory-like atmosphere",
  "Decorative painterly art print, woodblock-inspired composition, strong graphic shapes, softened carved-line texture, saturated limited palette, symbolic weather patterning, nostalgic handmade illustration",
];

const args = process.argv.slice(2);
let imageLimit = null;
for (let i = 0; i < args.length; i++) {
  if ((args[i] === "--limit" || args[i] === "-n") && args[i + 1]) {
    imageLimit = parseInt(args[i + 1], 10);
    break;
  }
}

if (!API_KEY) {
  console.error("Error: VENICE_API_KEY is not set in .env file");
  process.exit(1);
}

function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

function getRandomTemplate(templates) {
  return templates[Math.floor(Math.random() * templates.length)];
}

function getPromptTemplate(config, weatherCategory) {
  const categoryTemplates = config.categoryPromptTemplates?.[weatherCategory];

  if (Array.isArray(categoryTemplates) && categoryTemplates.length > 0) {
    return getRandomTemplate(categoryTemplates);
  }

  return getRandomTemplate(config.promptTemplates);
}

function buildPrompt(template, style, time, weather) {
  const weatherDescription = `${weather.name} weather, ${time.lighting}`;
  const prompt = template
    .replace("[STYLE]", style)
    .replace("[WEATHER DESCRIPTION]", weatherDescription)
    .replace(
      /\[(JACKRUSSEL|DOG) ACTION \+ EXPRESSION \+ ACCESSORY\]/g,
      weather.actionExpressionAccessory,
    );

  return `${prompt}\n\n${AESTHETIC_DIRECTION}`;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getWeatherCategory(weatherId) {
  if (WEATHER_TO_CATEGORY[weatherId]) {
    return WEATHER_TO_CATEGORY[weatherId];
  }

  if (weatherId.includes("snow")) return "snow";
  if (
    weatherId.includes("rain") ||
    weatherId.includes("drizzle") ||
    weatherId.includes("showers")
  )
    return "rain";
  if (
    weatherId.includes("storm") ||
    weatherId.includes("thunder") ||
    weatherId.includes("hail")
  )
    return "storm";
  if (weatherId.includes("sunny") || weatherId.includes("clear"))
    return "clear";
  return "cloudy";
}

function getRandomSeed() {
  return Math.floor(Math.random() * 999999998) + 1;
}

function getExistingVariationIndexes(outputBaseName, totalVariations) {
  const existingIndexes = new Set();

  if (!fs.existsSync(OUTPUT_DIR)) {
    return existingIndexes;
  }

  const escapedBaseName = outputBaseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filePattern = new RegExp(`^${escapedBaseName}-(\\d+)\\.${OUTPUT_EXT}$`);

  for (const fileName of fs.readdirSync(OUTPUT_DIR)) {
    const match = fileName.match(filePattern);
    if (!match) {
      continue;
    }

    const variationNumber = parseInt(match[1], 10);
    if (variationNumber >= 1 && variationNumber <= totalVariations) {
      existingIndexes.add(variationNumber);
    }
  }

  return existingIndexes;
}

function getMissingVariationIndexes(outputBaseName, totalVariations) {
  const existingIndexes = getExistingVariationIndexes(
    outputBaseName,
    totalVariations,
  );
  const missingIndexes = [];

  for (
    let variationNumber = 1;
    variationNumber <= totalVariations;
    variationNumber++
  ) {
    if (!existingIndexes.has(variationNumber)) {
      missingIndexes.push(variationNumber);
    }
  }

  return missingIndexes;
}

async function generateImage(prompt, width, height, seed) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: prompt,
      width: width,
      height: height,
      format: OUTPUT_EXT,
      variants: 1,
      // style_preset: "Pixel Art",
      hide_watermark: true,
      seed: seed,
      safe_mode: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.images;
}

function saveImage(base64Data, filePath) {
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, buffer);
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Using model: ${MODEL}`);
  if (imageLimit) {
    console.log(`Image limit: ${imageLimit}`);
  }
  console.log("Loading config...");

  const config = loadConfig();
  const { width, height, variations, times, weathers } = config;

  ensureDir(OUTPUT_DIR);

  let totalGenerated = 0;
  let totalFailed = 0;
  const uniqueCategories = new Set(
    weathers.map((weather) => getWeatherCategory(weather.id)),
  );
  const totalCombinations = times.length * uniqueCategories.size;
  let current = 0;

  const representativeWeatherByCategory = new Map();
  for (const weather of weathers) {
    const category = getWeatherCategory(weather.id);
    if (!representativeWeatherByCategory.has(category)) {
      representativeWeatherByCategory.set(category, weather);
    }
  }

  let totalMissingImages = 0;
  let combinationsWithGaps = 0;
  for (const time of times) {
    for (const category of uniqueCategories) {
      const outputBaseName = `${category}-${time.id}`;
      const missingIndexes = getMissingVariationIndexes(
        outputBaseName,
        variations,
      );
      if (missingIndexes.length > 0) {
        combinationsWithGaps++;
        totalMissingImages += missingIndexes.length;
      }
    }
  }

  if (totalMissingImages === 0) {
    console.log(
      "\nAll combinations already have the required variations. Nothing to generate.",
    );
    return;
  }

  const effectiveLimit =
    imageLimit !== null && imageLimit < totalMissingImages
      ? imageLimit
      : totalMissingImages;
  console.log(
    `\nFilling ${effectiveLimit} missing images across ${combinationsWithGaps}/${totalCombinations} combinations (${variations} variations target)\n`,
  );

  for (const time of times) {
    const generatedCategoryForTime = new Set();

    for (const weather of weathers) {
      if (imageLimit !== null && totalGenerated >= imageLimit) {
        console.log(`\nReached image limit of ${imageLimit}. Stopping.`);
        break;
      }

      const weatherCategory = getWeatherCategory(weather.id);
      if (generatedCategoryForTime.has(weatherCategory)) {
        continue;
      }

      current++;
      const outputBaseName = `${weatherCategory}-${time.id}`;
      const missingVariationIndexes = getMissingVariationIndexes(
        outputBaseName,
        variations,
      );

      if (missingVariationIndexes.length === 0) {
        generatedCategoryForTime.add(weatherCategory);
        console.log(
          `[${current}/${totalCombinations}] Skipping ${outputBaseName} (already complete)`,
        );
        continue;
      }

      const representativeWeather =
        representativeWeatherByCategory.get(weatherCategory) || weather;

      console.log(
        `[${current}/${totalCombinations}] Generating ${outputBaseName} (missing: ${missingVariationIndexes.join(", ")})...`,
      );

      try {
        let savedForCombination = 0;

        for (const variationNumber of missingVariationIndexes) {
          if (imageLimit !== null && totalGenerated >= imageLimit) {
            break;
          }

          const styleIndex = (variationNumber - 1) % STYLES.length;
          const selectedStyle = STYLES[styleIndex];

          console.log(
            `  -> Using style ${styleIndex + 1}/${STYLES.length}: ${selectedStyle.substring(0, 60)}...`,
          );

          const prompt = buildPrompt(
            getPromptTemplate(config, weatherCategory),
            selectedStyle,
            time,
            representativeWeather,
          );

          const seed = getRandomSeed();

          try {
            console.log(`Prompt: ${prompt}\n\n`);
            const images = await generateImage(prompt, width, height, seed);

            if (!images || images.length === 0) {
              throw new Error("No image returned by API");
            }

            const fileName = `${outputBaseName}-${variationNumber}.${OUTPUT_EXT}`;
            const filePath = path.join(OUTPUT_DIR, fileName);
            saveImage(images[0], filePath);
            totalGenerated++;
            savedForCombination++;
          } catch (error) {
            totalFailed++;
            console.error(
              `  -> Variation ${variationNumber} failed (seed ${seed}): ${error.message}`,
            );
          }

          await delay(200);
        }

        generatedCategoryForTime.add(weatherCategory);

        console.log(
          `  -> Saved ${savedForCombination}/${missingVariationIndexes.length} missing images for ${outputBaseName}`,
        );
      } catch (error) {
        console.error(`  -> FAILED: ${error.message}`);
        totalFailed += missingVariationIndexes.length;
      }

      await delay(500);
    }

    if (imageLimit !== null && totalGenerated >= imageLimit) {
      break;
    }
  }

  console.log(`\nDone! Generated: ${totalGenerated}, Failed: ${totalFailed}`);
}

main().catch(console.error);
