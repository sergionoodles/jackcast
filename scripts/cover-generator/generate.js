import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "https://api.venice.ai/api/v1/image/generate";
const BACKGROUNDS_DIR = path.join(__dirname, "../../src/assets/backgrounds");
const CONFIG_PATH = path.join(__dirname, "config.json");
const MODEL = process.env.VENICE_MODEL || "qwen-image";
const API_KEY = process.env.VENICE_API_KEY;
const MAX_PROMPT_LENGTH = Number.parseInt(
  process.env.MAX_PROMPT_LENGTH || "1500",
  10,
);

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorize(color, value) {
  return `${color}${value}${ANSI.reset}`;
}

function formatLabel(label, color = ANSI.cyan) {
  return colorize(color, `${ANSI.bold}${label}${ANSI.reset}`);
}

function parseArgs(args) {
  const options = {
    check: false,
    dryRun: false,
    imageLimit: null,
    syncInventory: false,
    themeId: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }
    if (arg === "--check") {
      options.check = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--limit" || arg === "-n") {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a non-negative integer.`);
      }
      const limit = Number(value);
      if (!Number.isInteger(limit) || limit < 0) {
        throw new Error(`${arg} must be a non-negative integer.`);
      }
      options.imageLimit = limit;
      index += 1;
      continue;
    }
    if (arg === "--theme") {
      const themeId = args[index + 1];
      if (!themeId) {
        throw new Error("--theme requires a configured theme id.");
      }
      options.themeId = themeId;
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(`Usage: pnpm generate -- [options]

Options:
  --check             Validate configuration without API calls.
  --dry-run           List the generation plan without API calls.
  --limit, -n <count> Cap API attempts, including failed requests.
  --theme <id>        Generate one configured theme instead of every theme.
`);
      process.exit(0);
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  const noApiModes = [options.check, options.dryRun].filter(
    Boolean,
  ).length;
  if (noApiModes > 1) {
    throw new Error("Use only one of --check or --dry-run.");
  }

  return options;
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function validateConfig(config) {
  const errors = [];
  const { output, categories, constraints, themes, times } = config;

  if (!output || !Number.isInteger(output.width) || !Number.isInteger(output.height)) {
    errors.push("output.width and output.height must be integers.");
  }
  if (!output?.extension || !Number.isInteger(output.variations) || output.variations < 1) {
    errors.push("output.extension and a positive output.variations are required.");
  }
  if (!Array.isArray(constraints) || constraints.length === 0) {
    errors.push("At least one global illustration constraint is required.");
  }
  if (!Array.isArray(times) || times.length === 0) {
    errors.push("At least one time definition is required.");
  }
  if (!categories || Object.keys(categories).length === 0) {
    errors.push("At least one weather category is required.");
  }
  if (!themes || Object.keys(themes).length === 0) {
    errors.push("At least one theme prompt definition is required.");
  }

  for (const time of times || []) {
    if (!time.id || !time.lighting) {
      errors.push("Every time definition needs id and lighting.");
    }
  }

  for (const [categoryId, category] of Object.entries(categories || {})) {
    if (!category.weather) {
      errors.push(`Category "${categoryId}" needs a weather description.`);
    }
  }

  for (const [themeId, theme] of Object.entries(themes || {})) {
    if (!theme.backgroundSet || !theme.subject) {
      errors.push(`Theme "${themeId}" needs backgroundSet and subject.`);
    }
    for (const key of ["artDirections", "compositions"]) {
      if (!Array.isArray(theme[key]) || theme[key].length === 0) {
        errors.push(`Theme "${themeId}" needs at least one ${key} entry.`);
      }
    }
    for (const categoryId of Object.keys(categories || {})) {
      if (!Array.isArray(theme.scenes?.[categoryId]) || theme.scenes[categoryId].length === 0) {
        errors.push(
          `Theme "${themeId}" needs at least one ${categoryId} scene prompt.`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid config:\n- ${errors.join("\n- ")}`);
  }
}

function validateEnvironment() {
  if (!Number.isInteger(MAX_PROMPT_LENGTH) || MAX_PROMPT_LENGTH < 1) {
    throw new Error("MAX_PROMPT_LENGTH must be a positive integer.");
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getOutputDir(backgroundSet) {
  return path.join(BACKGROUNDS_DIR, backgroundSet);
}

function getExistingVariationIndexes(outputDir, outputBaseName, output) {
  const existingIndexes = new Set();

  if (!fs.existsSync(outputDir)) {
    return existingIndexes;
  }

  const escapedBaseName = outputBaseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filePattern = new RegExp(
    `^${escapedBaseName}-(\\d+)\\.${output.extension}$`,
  );

  for (const fileName of fs.readdirSync(outputDir)) {
    const match = fileName.match(filePattern);
    if (!match) {
      continue;
    }

    const variationNumber = Number.parseInt(match[1], 10);
    if (variationNumber >= 1 && variationNumber <= output.variations) {
      existingIndexes.add(variationNumber);
    }
  }

  return existingIndexes;
}

function getMissingVariationIndexes(outputDir, outputBaseName, output) {
  const existingIndexes = getExistingVariationIndexes(
    outputDir,
    outputBaseName,
    output,
  );
  const missingIndexes = [];

  for (let variation = 1; variation <= output.variations; variation += 1) {
    if (!existingIndexes.has(variation)) {
      missingIndexes.push(variation);
    }
  }

  return missingIndexes;
}

function pick(values, variationNumber) {
  return values[(variationNumber - 1) % values.length];
}

function buildPrompt({ config, themeId, theme, categoryId, time, variationNumber }) {
  const category = config.categories[categoryId];
  const artDirection = pick(theme.artDirections, variationNumber);
  const composition = pick(theme.compositions, variationNumber);
  const scene = pick(theme.scenes[categoryId], variationNumber);
  const prompt = [
    "Create a vertical 9:16 weather cover illustration.",
    `Theme: ${themeId}. ${artDirection}.`,
    `Subject: ${theme.subject}.`,
    `Composition: ${composition}.`,
    `Scene: ${scene}.`,
    `Weather: ${category.weather}.`,
    `Lighting: ${time.lighting}.`,
    `Required constraints: ${config.constraints.join(". ")}.`,
  ].join("\n\n");

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(
      `Prompt length ${prompt.length} exceeds MAX_PROMPT_LENGTH ${MAX_PROMPT_LENGTH}.`,
    );
  }

  return { artDirection, prompt };
}

function getDeterministicSeed(job) {
  const key = `${job.themeId}:${job.categoryId}:${job.time.id}:${job.variationNumber}`;
  let hash = 2166136261;

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 999999998 + 1;
}

function buildJobs(config, selectedThemes) {
  const jobs = [];
  let existingImages = 0;

  for (const [themeId, theme] of selectedThemes) {
    const outputDir = getOutputDir(theme.backgroundSet);

    for (const time of config.times) {
      for (const categoryId of Object.keys(config.categories)) {
        const outputBaseName = `${categoryId}-${time.id}`;
        const missingVariations = getMissingVariationIndexes(
          outputDir,
          outputBaseName,
          config.output,
        );
        existingImages += config.output.variations - missingVariations.length;

        for (const variationNumber of missingVariations) {
          jobs.push({
            categoryId,
            outputBaseName,
            outputDir,
            theme,
            themeId,
            time,
            variationNumber,
          });
        }
      }
    }
  }

  return { existingImages, jobs };
}

async function generateImage(prompt, output, seed) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      width: output.width,
      height: output.height,
      format: output.extension,
      variants: 1,
      hide_watermark: true,
      safe_mode: false,
      seed,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.images;
}

function saveImage(base64Data, filePath) {
  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
}

function printGenerationBlock({ job, seed, artDirection, prompt, fileName }) {
  const divider = colorize(ANSI.blue, "=".repeat(72));

  console.log(`\n${divider}`);
  console.log(
    `${formatLabel("GENERATING", ANSI.magenta)} ${colorize(ANSI.bold, fileName)}`,
  );
  console.log(`${formatLabel("THEME")} ${job.themeId}`);
  console.log(`${formatLabel("COMBINATION")} ${job.outputBaseName}`);
  console.log(`${formatLabel("VARIATION")} ${job.variationNumber}`);
  console.log(`${formatLabel("SEED")} ${seed}`);
  console.log(`${formatLabel("ART DIRECTION")} ${artDirection}`);
  console.log(colorize(ANSI.dim, "-".repeat(72)));
  console.log(`${formatLabel("PROMPT", ANSI.yellow)}\n${prompt}`);
  console.log(divider);
}

function printPlan({ config, selectedThemes, existingImages, jobs, imageLimit }) {
  const targetImages =
    selectedThemes.length *
    config.times.length *
    Object.keys(config.categories).length *
    config.output.variations;
  const jobsByTheme = Object.fromEntries(
    selectedThemes.map(([themeId]) => [themeId, 0]),
  );

  for (const job of jobs) {
    jobsByTheme[job.themeId] += 1;
  }

  console.log(`Using model: ${MODEL}`);
  console.log(`Themes: ${selectedThemes.map(([themeId]) => themeId).join(", ")}`);
  console.log(`Target images: ${targetImages}`);
  console.log(`Existing images: ${existingImages}`);
  console.log(`Missing images: ${jobs.length}`);
  console.log(
    `Missing by theme: ${Object.entries(jobsByTheme)
      .map(([themeId, count]) => `${themeId}=${count}`)
      .join(", ")}`,
  );
  if (imageLimit !== null) {
    console.log(`API attempt limit: ${imageLimit}`);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  validateEnvironment();
  const config = loadConfig();
  validateConfig(config);

  const configuredThemes = Object.entries(config.themes);
  const selectedThemes = options.themeId
    ? configuredThemes.filter(([themeId]) => themeId === options.themeId)
    : configuredThemes;

  if (selectedThemes.length === 0) {
    throw new Error(`Unknown configured theme: ${options.themeId}`);
  }

  const { existingImages, jobs } = buildJobs(config, selectedThemes);
  printPlan({
    config,
    selectedThemes,
    existingImages,
    imageLimit: options.imageLimit,
    jobs,
  });

  if (options.check) {
    console.log("Configuration is valid.");
    return;
  }

  if (options.dryRun) {
    const previewJobs = jobs.slice(0, 5);
    for (const job of previewJobs) {
      const { prompt } = buildPrompt({ config, ...job });
      console.log(`\n${job.themeId}/${job.outputBaseName}-${job.variationNumber}`);
      console.log(prompt);
    }
    if (jobs.length > previewJobs.length) {
      console.log(`\n... ${jobs.length - previewJobs.length} additional jobs not shown.`);
    }
    return;
  }

  const plannedJobs =
    options.imageLimit === null ? jobs : jobs.slice(0, options.imageLimit);
  if (plannedJobs.length === 0) {
    console.log("No API calls needed.");
    return;
  }
  if (!API_KEY) {
    throw new Error("VENICE_API_KEY is not set in .env.");
  }

  let attempted = 0;
  let generated = 0;
  let failed = 0;

  for (const job of plannedJobs) {
    ensureDir(job.outputDir);
    const fileName = `${job.outputBaseName}-${job.variationNumber}.${config.output.extension}`;
    const filePath = path.join(job.outputDir, fileName);
    const { artDirection, prompt } = buildPrompt({ config, ...job });
    const seed = getDeterministicSeed(job);
    attempted += 1;

    try {
      printGenerationBlock({ job, seed, artDirection, prompt, fileName });
      const images = await generateImage(prompt, config.output, seed);
      if (!images?.[0]) {
        throw new Error("No image returned by API.");
      }

      saveImage(images[0], filePath);
      generated += 1;
      console.log(
        `${formatLabel("SAVED", ANSI.green)} ${fileName} ${colorize(ANSI.dim, `(${filePath})`)}`,
      );
    } catch (error) {
      failed += 1;
      console.error(
        `${formatLabel("FAILED", ANSI.red)} ${fileName}: ${error.message}`,
      );
    }

    await delay(200);
  }

  console.log(
    `\nDone. Attempted: ${attempted}, saved: ${generated}, failed: ${failed}, remaining: ${jobs.length - attempted}.`,
  );
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
