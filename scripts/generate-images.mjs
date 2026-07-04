/**
 * Gemini Image Generation Script
 * Generates product and hero images for the Konzept Terrasse website.
 * Run: node scripts/generate-images.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "client", "public", "images");

const API_KEY = process.env.GeminiApiKey;
if (!API_KEY) {
  console.error("❌  GeminiApiKey nicht in .env gesetzt");
  process.exit(1);
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

/** Image prompts – high-quality architectural photography style */
const images = [
  {
    file: "hero.jpg",
    prompt:
      "Ultra-photorealistic 4K architectural photography of a luxurious modern terrace roof (Terrassenüberdachung) in brushed aluminium with a large glass panel roof, dramatic evening golden-hour lighting, dark background, elegant German home, ultra-sharp detail, cinematic depth of field, no people, professional real-estate photography",
  },
  {
    file: "product-terrassenueberdachung.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of a premium aluminium terrace roof attached to a modern German house, white powder-coated frame with clear glass roof panels, bright daylight, contemporary architecture, high-detail close-up showing clean joins and high-quality materials, no people",
  },
  {
    file: "product-wintergarten.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of a modern glass winter garden (Wintergarten) with floor-to-ceiling aluminium framing, bright interior, plants, Scandinavian interior style, no people, architectural photography, golden-hour natural light",
  },
  {
    file: "product-bioclimatic-lamellendach.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of a bioclimatic louvred roof pergola (Lamellendach) with motorised adjustable aluminium louvres, outdoor terrace of a luxury villa, evening light, no people, architectural photography, elegant and minimal design",
  },
  {
    file: "product-pergolen-systeme.jpg",
    prompt:
      "Ultra-photorealistic 4K architectural photography of a motorised aluminium pergola system with retractable roof panels, modern patio with outdoor furniture, no people, bright daylight, premium outdoor living",
  },
  {
    file: "product-carport.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of a sleek modern aluminium carport with flat polycarbonate roof, parked luxury car underneath, clean white finish, modern German home, no people",
  },
  {
    file: "product-guillotine-glassysteme.jpg",
    prompt:
      "Ultra-photorealistic 4K architectural photography of a motorised guillotine glass wall system on a restaurant terrace, fully open glass panels sliding vertically, dramatic evening light, elegant setting, no people",
  },
  {
    file: "product-vollkassettenmarkise.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of a Weinor fully-cassette awning (Vollkassettenmarkise) with LED lighting, extended over a modern patio, warm dusk lighting, elegant design, no people",
  },
  {
    file: "product-glas-schiebesysteme.jpg",
    prompt:
      "Ultra-photorealistic 4K architectural photography of a frameless aluminium sliding glass system (Glasschiebewand) with 10mm ESG safety glass, partially open, modern terrace, bright daylight, no people",
  },
  {
    file: "product-sonnenschutz.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of a ZIP screen blind (Senkrechtmarkise) with dark grey fabric, modern floor-to-ceiling window, bright interior, clean minimalist design, no people",
  },
  {
    file: "product-oberdachmarkise.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of an external glass roof blind (Oberdachmarkise) with premium Serge Ferrari fabric, mounted beneath a glass terrace roof, blocking sunlight, no people, architectural detail",
  },
  {
    file: "product-unterglasmarkise.jpg",
    prompt:
      "Ultra-photorealistic 4K product photography of an under-glass awning (Unterglasmarkise) mounted on the inside of a glass terrace roof, elegant fabric, bright natural light, no people, clean detail shot",
  },
  {
    file: "product-eingangsvordach.jpg",
    prompt:
      "Ultra-photorealistic 4K architectural photography of a premium aluminium entrance canopy (Eingangsvordach) on a modern German villa entrance, flat glass panel, clean lines, evening light with subtle illumination, no people",
  },
];

async function generateImage(prompt, filename) {
  // imagen-4.0-generate-001 uses the predict endpoint (same structure as imagen-3.0)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;
  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "16:9",
      outputMimeType: "image/jpeg",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("No image data in response: " + JSON.stringify(data).slice(0, 300));

  const outPath = join(OUT_DIR, filename);
  writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log(`✅  ${filename}`);
}

async function main() {
  console.log(`Generating ${images.length} images into ${OUT_DIR} ...\n`);

  for (const { file, prompt } of images) {
    const outPath = join(OUT_DIR, file);
    if (existsSync(outPath)) {
      console.log(`⏭️   ${file} – bereits vorhanden, übersprungen`);
      continue;
    }
    process.stdout.write(`⏳  ${file} ...`);
    try {
      await generateImage(prompt, file);
    } catch (err) {
      console.error(`\n❌  ${file}: ${err.message}`);
    }
    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\nFertig.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
