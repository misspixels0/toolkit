/**
 * Local video renderer — run this on your own computer, NOT on Vercel.
 * Vercel's serverless functions don't ship ffmpeg and have time limits, so
 * final video assembly happens here instead.
 *
 * Requirements: ffmpeg installed and on your PATH (https://ffmpeg.org/download.html)
 *
 * Usage:
 *   node scripts/render-video.js --audio voiceover.mp3 --background bg.mp4 --captions captions.srt --out final.mp4
 *
 * --background can be a looping video OR a single image (jpg/png) — a still image
 * will be looped for the length of the audio automatically.
 */

const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const audio = arg("audio");
const background = arg("background");
const captions = arg("captions");
const out = arg("out", "final.mp4");

if (!audio || !background) {
  console.error("Usage: node scripts/render-video.js --audio voice.mp3 --background bg.mp4|bg.jpg [--captions captions.srt] --out final.mp4");
  process.exit(1);
}

const isImage = /\.(jpg|jpeg|png)$/i.test(background);

const filterParts = [];
if (captions && fs.existsSync(captions)) {
  const srtPath = captions.replace(/\\/g, "/").replace(/:/g, "\\:");
  filterParts.push(`subtitles='${srtPath}'`);
}

const args = [];

if (isImage) {
  args.push("-loop", "1", "-i", background);
} else {
  args.push("-stream_loop", "-1", "-i", background);
}
args.push("-i", audio);

if (filterParts.length) {
  args.push("-vf", filterParts.join(","));
}

args.push(
  "-shortest",
  "-map", "0:v:0",
  "-map", "1:a:0",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-y",
  out
);

console.log("Running: ffmpeg " + args.join(" "));

execFile("ffmpeg", args, (error, stdout, stderr) => {
  if (error) {
    console.error("ffmpeg failed:", stderr || error.message);
    process.exit(1);
  }
  console.log(`Done — saved to ${path.resolve(out)}`);
});
