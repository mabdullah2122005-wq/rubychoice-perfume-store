// Downloads free perfume photography from Unsplash's CDN into /public.
// Each candidate is verified (HTTP 200, image content-type, >15 KB).
// Run once: node scripts/download-photos.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "products", "photos");
mkdirSync(outDir, { recursive: true });

const params = "?auto=format&fit=crop&w=900&q=80";
const candidates = [
  ["q01", "photo-1615461066159-fea0960485d5"],
  ["q02", "photo-1615461065624-21b562ee5566"],
  ["q03", "photo-1615461066841-6116e61058f4"],
  ["q04", "photo-1631729371254-42c2892f0e6e"],
  ["q05", "photo-1612817159949-195b6eb9e31a"],
  ["q06", "photo-1598452963314-b09f397a5c48"],
  ["q07", "photo-1608248543803-ba4f8c70ae0b"],
  ["q08", "photo-1620756236308-65c3ef5d25f3"],
  ["q09", "photo-1556228578-8c89e6adf883"],
  ["q10", "photo-1556228720-195a672e8a03"],
  ["q11", "photo-1629198688000-71f23e745b6e"],
  ["q12", "photo-1602928321679-560bb453f190"],
  ["q13", "photo-1595872018818-97555653a011"],
  ["q14", "photo-1583467875263-d50dec37a88c"],
  ["q15", "photo-1585232004423-244e0e6904e3"],
  ["q16", "photo-1619451334792-150fd785ee74"],
  ["q17", "photo-1592842232655-e5d345cbc2d0"],
  ["q18", "photo-1594736797933-d0e501ba2fe6"],
  ["q19", "photo-1615160460366-2c0b8a969e69"],
  ["q20", "photo-1618330834871-dd22c2c226ac"],
];

const ok = [];
for (const [name, id] of candidates) {
  const url = `https://images.unsplash.com/${id}${params}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) {
      console.log(`SKIP ${name} (${res.status} ${type})`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 15_000) {
      console.log(`SKIP ${name} (too small: ${buf.length}B)`);
      continue;
    }
    writeFileSync(join(outDir, `${name}.jpg`), buf);
    ok.push(name);
    console.log(`OK   ${name}.jpg (${Math.round(buf.length / 1024)} KB)`);
  } catch (error) {
    console.log(`SKIP ${name} (${error.message})`);
  }
}
console.log(`\nDownloaded ${ok.length}/${candidates.length}: ${ok.join(", ")}`);
