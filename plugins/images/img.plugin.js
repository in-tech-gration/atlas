import { Jimp } from "jimp";
import fs from "node:fs";
import path from "node:path";

// Source: https://github.com/stephan-fischer/jimp/blob/89f0daa5adcfb204809d1b9aa613b5628fda4aa9/packages/plugin-sharpen/src/modules/util.js
const convolution = (
  bitmap,
  matrixX,
  matrixY,
  matrix,
  divisor,
  bias,
  preserveAlpha,
  clamp,
  color,
  alpha
) => {
  const srcPixels = new Uint8ClampedArray(bitmap.data);
  const srcWidth = bitmap.width;
  const srcHeight = bitmap.height;
  const dstPixels = bitmap.data;

  divisor = divisor || 1;
  bias = bias || 0;

  // default true
  if (!preserveAlpha && preserveAlpha !== false) {
    preserveAlpha = true;
  }

  if (!clamp && clamp !== false) {
    clamp = true;
  }

  color = color || 0;
  alpha = alpha || 0;

  const cols = matrixY >> 1;
  const rows = matrixX >> 1;
  const clampG = (color >> 8) & 0xff;
  const clampB = color & 0xff;
  const clampA = alpha * 0xff;

  let index = 0;
  const clampR = (color >> 16) & 0xff;

  for (let y = 0; y < srcHeight; y += 1) {
    for (let x = 0; x < srcWidth; x += 1, index += 4) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let replace = false;
      let mIndex = 0;
      let v;

      for (let row = -rows; row <= rows; row += 1) {
        const rowIndex = y + row;
        let offset;

        if (rowIndex >= 0 && rowIndex < srcHeight) {
          offset = rowIndex * srcWidth;
        } else if (clamp) {
          offset = y * srcWidth;
        } else {
          replace = true;
        }

        for (let col = -cols; col <= cols; col += 1) {
          const m = matrix[mIndex++];

          if (m !== 0) {
            let colIndex = x + col;

            if (!(colIndex >= 0 && colIndex < srcWidth)) {
              if (clamp) {
                colIndex = x;
              } else {
                replace = true;
              }
            }

            if (replace) {
              r += m * clampR;
              g += m * clampG;
              b += m * clampB;
              a += m * clampA;
            } else {
              const p = (offset + colIndex) << 2;
              r += m * srcPixels[p];
              g += m * srcPixels[p + 1];
              b += m * srcPixels[p + 2];
              a += m * srcPixels[p + 3];
            }
          }
        }
      }

      dstPixels[index] =
        (v = r / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
      dstPixels[index + 1] =
        (v = g / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
      dstPixels[index + 2] =
        (v = b / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
      dstPixels[index + 3] = preserveAlpha
        ? srcPixels[index + 3]
        : (v = a / divisor + bias) > 255
          ? 255
          : v < 0
            ? 0
            : v | 0;
    }
  }
}

const filtersWithParams = [
  ["downscale", "[=<NUMBER>]"],
  ["ocr", " (Optical Character Recognition)"],
  ["scale", "=<NUMBER>"],
  ["sharpen", "=<NUMBER>"],
  ["upscale", "[=<NUMBER>]"],
];

function displaySupportedFilters(filters) {

  console.log("Available filters are:\n");

  filters.forEach(filter => {
    console.log("- " + filter.join(""));
  });

  return console.log("\n");

}

// TODO: Batch Image (Files/Folders) Processing
export default async function img(options) {

  let [filter, filename] = options;
  // console.log("img()", filter, filename);

  const filters = filtersWithParams.map(filterWithParams => {
    return filterWithParams[0];
  });

  if (options.length === 0) {

    console.log("\nUsage: atlas -u img <filter> <filename>");
    return displaySupportedFilters(filtersWithParams);
  }

  if (options.length < 2) {
    return console.log("Missing arguments: expected 2 arguments to be passed.")
  }

  let filterParams;

  if (filter.includes("=")) {
    filterParams = filter.split("=")[1];
    filter = filter.split("=")[0];
  }

  if (!filters.includes(filter)) {

    console.log(`\nERROR: Filter ${filter} not supported.`);
    return displaySupportedFilters(filtersWithParams);

  }

  const fname = path.parse(filename);

  // OCR
  if (filter === "ocr") {

    const isDir = fs.lstatSync(filename).isDirectory();

    if (isDir) {

      // console.log("Batch processing...");

      const isFile = fileName => {
        return fs.lstatSync(fileName).isFile();
      };

      const imageArr = fs.readdirSync(filename)
        .map(fileName => path.join(filename, fileName))
        .filter(isFile);

      // console.log(imageArr);

      const { createWorker, createScheduler } = await import("tesseract.js");
      const scheduler = createScheduler();

      // Creates worker and adds to scheduler
      const workerGen = async () => {
        const worker = await createWorker('eng', 1, { cachePath: '.' });
        scheduler.addWorker(worker);
      };

      const workerN = 4;
      (async () => {
        const resArr = Array(workerN);
        for (let i = 0; i < workerN; i++) {
          resArr[i] = workerGen();
        }
        await Promise.all(resArr);

        const resArr2 = Array(imageArr.length);

        for (let i = 0; i < imageArr.length; i++) {
          resArr2[i] = scheduler
            .addJob('recognize', imageArr[i])
            .then((x) => x.data.text);
        }

        const res = await Promise.all(resArr2);
        let output = "";
        res.forEach((r, index) => {
          output += `(Image #${index + 1}) | ${imageArr[index]}\n\n`;
          output += r;
          output += "\n---\n";
          output += "\n";
        });
        console.log(output);
        await scheduler.terminate(); // It also terminates all workers.

      })();

    } else {

      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker('eng');
      const image = path.resolve(filename);
      const ret = await worker.recognize(image);
      console.log(ret.data.text);
      await worker.terminate();

    }

  }

  // SHARPEN
  if (filter === "sharpen") {

    const image = await Jimp.read(filename);
    const factor = Number(filterParams) || 3;

    // Source: https://github.com/stephan-fischer/jimp/blob/89f0daa5adcfb204809d1b9aa613b5628fda4aa9/packages/plugin-sharpen/src/index.js
    convolution(image.bitmap, 3, 3, [
      -factor / 16,
      -factor / 8,
      -factor / 16,
      -factor / 8,
      factor * 0.75 + 1,
      -factor / 8,
      -factor / 16,
      -factor / 8,
      -factor / 16
    ]);

    await image.write(fname.name + ".sharpened" + fname.ext);

  }

  // UPSCALE/DOWNSCALE
  if (filter === "upscale" || filter === "downscale") {

    const image = await Jimp.read(filename);
    let scaleFilterParam = filterParams ? filterParams : filter === "upscale" ? 2 : 0.5;
    image.scale(Number(scaleFilterParam));
    await image.write(fname.name + "." + filter + "d" + fname.ext);

  }

  // SCALE
  if (filter === "scale") {

    if (!filterParams) {
      return console.log("For filter 'scale' a parameter is required: scale=0.5, scale=2, etc.")
    }

    const image = await Jimp.read(filename);
    image.scale(Number(filterParams));
    await image.write(fname.name + ".scaled" + fname.ext);

  }


}

// TODO: Check https://github.com/haraldF/qrsharpener/