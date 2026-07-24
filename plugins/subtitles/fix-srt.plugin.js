import fs from 'node:fs/promises';
import path from "node:path";
import { parse, CaptionTimeSpanValidator, ErrorCode } from "./verify-srt.plugin.js";

export function fixErrorEndtime(parsedSrt, ctsValidationReport) {

  const fixedParsedSrt = structuredClone(parsedSrt);

  // FIXING CAPTION TIME SPAN ERRORS:
  ctsValidationReport.forEach(error => {

    // Fixing 'validatorErrorEndTime' errors: 
    if (error.errorCode === ErrorCode.VALIDATOR_ERROR_END_TIME) {
      const foundIndex = fixedParsedSrt.findIndex(sub => {
        return sub.sequenceNumber === error.sequenceNumber;
      });
      const brokenSub = fixedParsedSrt[foundIndex];
      const prevSub = fixedParsedSrt[foundIndex - 1];
      prevSub.time.rawEnd = brokenSub.time.rawStart;
      prevSub.time.end = brokenSub.time.end;
    }

  });

  const fixedSrt = fixedParsedSrt.map(srt => {
    return `${srt.sequenceNumber}\n${srt.time.rawStart} --> ${srt.time.rawEnd}\n${srt.text}\n\n`
  }).join("").trimEnd();

  return fixedSrt;

}

export default async function fixSrt(options, globalOptions, cli) {

  const srtFile = options[0];
  let output = options[1];

  if (!output) {
    const parsedPath = path.parse(srtFile);
    output = `${parsedPath.name}.fixed${parsedPath.ext}`;
    console.log(`Output filename not provided. Using: ${output}`);
  }

  if (!srtFile) {
    return console.log("Error: missing .srt input file.");
  }

  try {

    // Read the SRT file
    const data = await fs.readFile(srtFile, 'utf8');

    const parsedSrt = parse(data);

    // CAPTION TIME SPAN VALIDATION:
    const ctsValidator = new CaptionTimeSpanValidator(parsedSrt);
    const ctsValidationReport = ctsValidator.validate();

    if (ctsValidationReport.length > 0) {

      console.log("Detected errors. Let's try and fix things...");
      console.log("This fix is mostly about YouTube automatic subtitles.");
      console.log("It is intended to re-arrange subtitle timing to avoid");
      console.log("displaying the next subtitle on top of the previous one.");
      
      const fixedSrt = fixErrorEndtime(parsedSrt, ctsValidationReport);
      await fs.writeFile(output, fixedSrt);
      return;

    }

    console.log("All good! SRT file successfully verified and fixed.");

  } catch (err) {

    console.error('Error:', err);

  }

}