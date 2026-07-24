import fs from "node:fs";
import path from "node:path";

// TODO: Integrate srt2json and srt2txt plugins
// TODO: Create Class: class SRT { formatTime(){} }
// TODO: Check and Integrate: https://github.com/gsantiago/subtitle.js or https://www.npmjs.com/package/subtitle

/**
 * Parses SRT time string (HH:MM:SS,mmm) to milliseconds
 */
function parseTime(timeStr) {
  const [time, milliseconds] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + parseInt(milliseconds);
}

/**
 * Shifts time in milliseconds by specified seconds
 */
function shiftTime(milliseconds, shiftSeconds) {
  const shifted = milliseconds + (shiftSeconds * 1000);
  return Math.max(0, shifted); // Ensure time doesn't go negative
}

/**
 * Formats milliseconds back to SRT time string (HH:MM:SS,mmm)
 */
function formatTime(milliseconds) {

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;

}

/**
 * Shifts timing in SRT subtitle files
 * @param {string} inputFilePath - Path to input SRT file
 * @param {string} outputFilePath - Path to output SRT file
 * @param {number} shiftSeconds - Seconds to shift (positive = forward, negative = backward)
 * @param {boolean} overwrite - Whether to overwrite input file if no output specified
 */
function shiftSrtTiming(inputFilePath, outputFilePath, shiftSeconds, overwrite = false) {

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
  const lines = content.split('\n');

  const shiftedLines = [];
  let currentSubtitle = {
    index: 0,
    start: null,
    end: null,
    text: []
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';

    // Empty line indicates end of subtitle block
    if (line === '' && currentSubtitle.start !== null) {
      // Process the completed subtitle
      const shiftedStart = shiftTime(currentSubtitle.start, shiftSeconds);
      const shiftedEnd = shiftTime(currentSubtitle.end, shiftSeconds);

      shiftedLines.push(currentSubtitle.index.toString());
      shiftedLines.push(`${formatTime(shiftedStart)} --> ${formatTime(shiftedEnd)}`);
      shiftedLines.push(...currentSubtitle.text);
      shiftedLines.push(''); // Empty line separator

      // Reset for next subtitle
      currentSubtitle = {
        index: 0,
        start: null,
        end: null,
        text: []
      };
      continue;
    }

    // Parse subtitle index
    if (!isNaN(line) && currentSubtitle.start === null) {
      currentSubtitle.index = parseInt(line);
      continue;
    }

    // Parse timing line
    if (line.includes(' --> ') && currentSubtitle.start === null) {
      const [start, end] = line.split(' --> ').map(time => parseTime(time.trim()));
      currentSubtitle.start = start;
      currentSubtitle.end = end;
      continue;
    }

    // Text lines (everything else)
    if (currentSubtitle.start !== null) {
      currentSubtitle.text.push(line);
    }
  }

  // Handle case where file doesn't end with empty line
  if (currentSubtitle.start !== null) {
    const shiftedStart = shiftTime(currentSubtitle.start, shiftSeconds);
    const shiftedEnd = shiftTime(currentSubtitle.end, shiftSeconds);

    shiftedLines.push(currentSubtitle.index.toString());
    shiftedLines.push(`${formatTime(shiftedStart)} --> ${formatTime(shiftedEnd)}`);
    shiftedLines.push(...currentSubtitle.text);
  }

  // Write the shifted content
  fs.writeFileSync(outputFilePath, shiftedLines.join('\n'), 'utf8');
  console.log(`Successfully shifted timings by ${shiftSeconds} seconds`);
  console.log(`Output saved to: ${outputFilePath}`);
}

/**
 * ⚠️ WORK IN PROGRESS...
 */
export default async function srt(options) {

  const srtFile = options[0];
  const secs = -8.5;
  const outputFile = "";
  const overwriteFlag = false;
  // console.log({ srtFile });

  const shiftSeconds = parseFloat(secs);
  // const overwriteFlag = args.includes('--overwrite');

  try {
    shiftSrtTiming(srtFile, outputFile, shiftSeconds, overwriteFlag);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

}
