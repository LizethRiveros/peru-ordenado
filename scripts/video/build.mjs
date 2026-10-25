/**
 * Builds the Quipu promo video (typing, smooth shape morphs, music) and a GIF of it.
 *
 *   cd scripts/video && npm install
 *   node build.mjs                 # → media/quipu-huancavelica-vertical.mp4 (1080x1920) and media/quipu-huancavelica.gif
 *   node build.mjs --test 3,8,15   # PNG stills of those seconds in .build/, no video
 *
 * Needs: bun, Node 18+, Chrome (CHROME=...), ffmpeg (FFMPEG=...), Python 3 with numpy (PYTHON=...).
 * Env DISTRICT / DEP choose the example district and its department id (default Acoria / 09).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const build = join(here, ".build");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const PYTHON = process.env.PYTHON || "python";
const out = process.env.OUT || join(root, "media");
const i = process.argv.indexOf("--test");
const test = i > -1 ? process.argv[i + 1] : "";

const run = (cmd, args, cwd = build, env = {}) => {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, FFMPEG, ...env }, shell: cmd === "bun" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`);
};

mkdirSync(build, { recursive: true });
run("bun", [join(here, "data.ts")], root);
const data = readFileSync(join(build, "data.json"), "utf8");
writeFileSync(join(build, "page.html"), readFileSync(join(here, "animation.html"), "utf8").replace("__DATA__", () => data));

const render = join(here, "render.js");
if (test) {
  run("node", [render, "test", ...test.split(",")], build, process.argv.includes("--h") ? { FMT: "h" } : {});
  console.log(`stills in ${build}`);
  process.exit(0);
}

const fi = process.argv.indexOf("--format");
const format = fi > -1 ? process.argv[fi + 1] : "both"; // vertical | horizontal | both
const jobs = [];
if (format !== "horizontal") jobs.push({ name: "vertical", fmt: "", silent: "silent.mp4" });
if (format !== "vertical") jobs.push({ name: "horizontal", fmt: "h", silent: "silent_h.mp4" });
for (const job of jobs) run("node", [render, "full"], build, { FMT: job.fmt });
run(PYTHON, [join(here, "audio.py")]); // reads clicks.json (typing times), writes music.wav
mkdirSync(out, { recursive: true });
for (const job of jobs) {
  const mp4 = join(out, `quipu-huancavelica-${job.name}.mp4`);
  run(FFMPEG, ["-y", "-loglevel", "error", "-i", job.silent, "-i", "music.wav",
    "-filter_complex", "[0:v]scale=in_range=full:out_range=tv,format=yuv420p[v];[1:a]loudnorm=I=-16:TP=-1.5:LRA=9[a]",
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
    "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", mp4]);
  console.log("wrote", mp4);
}
// GIF: two-pass palette, 405x720, 12 fps, loops
const gif = join(out, "quipu-huancavelica.gif");
run(FFMPEG, ["-y", "-loglevel", "error", "-i", jobs[0].silent, "-vf",
  "fps=12,scale=405:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4", "-loop", "0", gif]);
console.log("wrote", gif);
