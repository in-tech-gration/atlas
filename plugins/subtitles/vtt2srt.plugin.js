import fs from "node:fs";
import path from "node:path";

// Convert VTT to SRT ❌ FAIL
// https://github.com/narsing-itkampalli/subtitle-converter-cli
function convertVttToSrt(vttText) {

  const cleaned = vttText.replace(/^WEBVTT[\s\S]*?\n+/, '').trim();
  const lines = cleaned.split(/\r?\n/);

  const entries = [];
  let current = [];

  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length > 0) entries.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) entries.push(current);

  // Convert entries to SRT
  const srt = entries.map((entry, index) => {
    let [timeLine, ...textLines] = entry;

    timeLine = timeLine.replace(/(\d{2}):(\d{2})\.(\d{3})/g, (_, mm, ss, ms) => {
      return `00:${mm}:${ss},${ms}`;
    });

    return `${index + 1}\r\n${timeLine}\r\n${textLines.join('\r\n')}`;
  });

  return srt.join('\r\n\r\n') + '\r\n';
}

// CHECK:
// https://github.com/osk/node-webvtt#readme
// https://github.dev/riazXrazor/vtt-to-srt
// https://github.dev/mccauli/subtitle-converter#readme

function convert(inputFilePath, outputFilePath, shiftSeconds, overwrite = false) {

  // Validate input file exists
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Input file not found: ${inputFilePath}`);
  }

  // If no output file specified, use input file (with overwrite flag)
  if (!outputFilePath) {
    if (!overwrite) {
      throw new Error('Output file not specified and overwrite is false');
    }
    outputFilePath = inputFilePath;
  }

  // Read the SRT file
  const content = fs.readFileSync(inputFilePath, 'utf8');
  const srt = convertVttToSrt(content);
  // const lines = content.split('\n');
  return srt;

}

/**
 * ⚠️ WORK IN PROGRESS
 */
export default async function vtt2srt(options, globalOptions, cli) {

  return console.log("Work in progress...");

  // console.log({ options, globalOptions });
  const srtFile = options[0];
  const secs = 0;
  const overwriteFlag = false;
  console.log({ srtFile });

  const shiftSeconds = parseFloat(secs);
  // const overwriteFlag = args.includes('--overwrite');

  try {
    const srt = convert(srtFile, "outputFile", shiftSeconds, overwriteFlag);
    console.log(srt);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

}