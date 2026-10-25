// IGN administrative boundaries (2020) via OCHA HDX, CC BY-IGO. Writes data/raw/per_admin{1,2,3}.geojson.
import { $ } from "bun";

const URL =
  "https://data.humdata.org/dataset/54fc7f4d-f4c0-4892-91f6-2fe7c1ecf363/resource/63647792-0951-40d2-a30e-4a0e60f7a176/download/per_admin_boundaries.geojson.zip";

await $`mkdir -p data/raw`;
await $`curl -fL -o data/raw/boundaries.zip ${URL}`;
await $`unzip -o data/raw/boundaries.zip per_admin1.geojson per_admin2.geojson per_admin3.geojson -d data/raw`;
await $`rm data/raw/boundaries.zip`;
