import fs from 'node:fs/promises';

// BASED ON: https://github.com/taoning2014/srt-validator

export const ErrorCode = {
  PARSER_ERROR_MISSING_TEXT: 'parserErrorMissingText',
  PARSER_ERROR_MISSING_SEQUENCE_NUMBER: 'parserErrorMissingSequenceNumber',
  PARSER_ERROR_INVALID_SEQUENCE_NUMBER: 'parserErrorInvalidSequenceNumber',
  PARSER_ERROR_MISSING_TIME_SPAN: 'parserErrorMissingTimeSpan',
  PARSER_ERROR_INVALID_TIME_SPAN: 'parserErrorInvalidTimeSpan',
  PARSER_ERROR_INVALID_TIME_STAMP: 'parserErrorInvalidTimeStamp',
  VALIDATOR_ERROR_START_TIME: 'validatorErrorStartTime',
  VALIDATOR_ERROR_END_TIME: 'validatorErrorEndTime',
  VALIDATOR_ERROR_SEQUENCE_NUMBER_START: 'validatorErrorSequenceNumberStart',
  VALIDATOR_ERROR_SEQUENCE_NUMBER_INCREMENT: 'validatorErrorSequenceNumberIncrement',
}

class ParseError extends Error {

  constructor(message, lineNumber, errorCode, sequenceNumber) {
    super(message);
    this.lineNumber = lineNumber ? lineNumber + 1 : ""; // lineNumber is 0-indexed
    this.errorCode = errorCode;
    this.sequenceNumber = sequenceNumber;
  }

}

const toMS = {
  hour: 36e5,
  minute: 6e4,
  second: 1e3,
};

const EOL = /\r?\n/;
const TRAILING_WHITE_SPACE = /\s$/;
const TIME_STAMP_REGEX = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;

/**
 * Parse a sequence number
 * @param  {String} sequenceNumber
 * @param  {Number} lineNumber - The line number currently being parsed
 * @return {Number}
 */
function parseSequenceNumber(sequenceNumber, lineNumber) {

  if (!sequenceNumber) {
    throw new ParseError(
      `Missing sequence number`,
      lineNumber,
      ErrorCode.PARSER_ERROR_MISSING_SEQUENCE_NUMBER
    );
  }

  const sequenceNum = Number(sequenceNumber);

  if (
    !Number.isInteger(sequenceNum) ||
    TRAILING_WHITE_SPACE.test(sequenceNumber)
  ) {
    throw new ParseError(
      `Expected Integer for sequence number: ${sequenceNumber}`,
      lineNumber,
      ErrorCode.PARSER_ERROR_INVALID_SEQUENCE_NUMBER
    );
  }
  return sequenceNum;
}

/**
 * Parse a timestamp into an integer
 * @example
 * Input:
 * "00:00:02,820"
 * Output:
 * 2820
 * @param  {String} timeStamp - a timestamp from a timespan.
 * @param  {Number} lineNumber - The line number currently being parsed
 * @return {Number}
 */
function parseTimeStamp(timeStamp, lineNumber) {

  const match = TIME_STAMP_REGEX.exec(timeStamp);

  if (!match) {
    throw new ParseError(
      `Invalid time stamp: ${timeStamp}`,
      lineNumber,
      ErrorCode.PARSER_ERROR_INVALID_TIME_STAMP
    );
  }

  const [hours, minutes, seconds, ms] = match.slice(1).map(Number);

  return (
    hours * toMS.hour + minutes * toMS.minute + seconds * toMS.second + ms
  );

}

/**
 * Parse a timespan into integer start and end values
 * @example
 * Input:
 * "00:00:02,820 --> 00:00:05,120"
 * Output:
 * { start: 2820, end: 5120 }
 *
 * @param  {String} timeSpan
 * @param  {Number} lineNumber - The line number currently being parsed
 * @return {Object}
 */
function parseTimeSpan(timeSpan, lineNumber) {

  if (!timeSpan) {
    throw new ParseError(
      `Missing time span`,
      lineNumber,
      ErrorCode.PARSER_ERROR_MISSING_TIME_SPAN
    );
  }

  const [start, end] = timeSpan.split(' --> ');

  if (!start || !end || TRAILING_WHITE_SPACE.test(timeSpan)) {
    throw new ParseError(
      `Invalid time span: ${timeSpan}`,
      lineNumber,
      ErrorCode.PARSER_ERROR_INVALID_TIME_SPAN
    );
  }

  return {
    rawStart: start, // Raw format: 00:00:03,880
    rawEnd: end,
    start: parseTimeStamp(start, lineNumber), // Parsed format: 3880
    end: parseTimeStamp(end, lineNumber),
  };
}

// SOURCE: https://github.com/taoning2014/srt-validator/blob/main/src/validators/caption-time-span-validator.ts
export class CaptionTimeSpanValidator {

  constructor(content) {
    this.content = content;
    this.report = [];
  }

  validate() {

    if (!this.content) {
      return this.result;
    }

    this.content.forEach((sub, index, subs) => {

      const { sequenceNumber, time: { start, end } } = sub;

      if (start >= end) {
        this.report.push({
          message: `start time ${start} should be less than end time ${end}`,
          lineNumber: null,
          errorCode: ErrorCode.VALIDATOR_ERROR_START_TIME,
          sequenceNumber
        });
      }

      if (index > 0) {

        const { time: { end: prevEnd } } = subs[index - 1];

        if (prevEnd > start) {
          this.report.push({
            message: `start time ${start} should be less than previous end time ${prevEnd}`,
            lineNumber: null,
            errorCode: ErrorCode.VALIDATOR_ERROR_END_TIME,
            sequenceNumber: sequenceNumber,
          });
        }
      }


    });

    return this.report;

  }
}

/**
 * Parses a given SRT file contents
 * @param  {String} file - Contents of an SRT file in the string format
 * @return {Array} - A list of subtitle metadata
 */
export function parse(file) {

  const lines = file.trim().split(EOL);
  const result = [];
  let lastSequenceNumber = null;

  for (let i = 0; i < lines.length; i += 1) {

    const lineNumbers = { chunkStart: i, timeSpan: i, text: i, chunkEnd: i };

    // First line
    const sequenceNumber = parseSequenceNumber(lines[i], i);

    if (sequenceNumber > 1 && lastSequenceNumber + 1 !== sequenceNumber) {
      throw new ParseError(
        `Invalid sequence number increment: ${sequenceNumber}`,
        sequenceNumber,
        ErrorCode.VALIDATOR_ERROR_SEQUENCE_NUMBER_INCREMENT
      );
    }

    // Second line
    i += 1;
    lineNumbers.timeSpan = i;
    const time = parseTimeSpan(lines[i], i);

    i += 1;
    lineNumbers.text = i;
    const linesOfText = [];
    while (lines[i] && lines[i].trim()) {
      linesOfText.push(lines[i]);
      i += 1;
    }
    const text = linesOfText.join('\n');
    if (!text) {
      throw new ParseError(
        `Missing caption text`,
        i,
        ErrorCode.PARSER_ERROR_MISSING_TEXT
      );
    }

    lineNumbers.chunkEnd = i - 1;

    lastSequenceNumber = sequenceNumber;

    result.push({
      lineNumbers,
      sequenceNumber,
      time,
      text,
    });
  }

  return result;
}

export default async function srtVerify(options, globalOptions, cli) {

  const srtFile = options[0];

  if (!srtFile) {
    return console.log("Error: missing .srt input file.");
  }

  try {

    // Read the SRT file
    const data = await fs.readFile(srtFile, 'utf8');

    const parsed = parse(data);

    // CAPTION TIME SPAN VALIDATION:
    const ctsValidator = new CaptionTimeSpanValidator(parsed);
    const ctsValidationReport = ctsValidator.validate();
    if (ctsValidationReport.length > 0) {
      throw new Error(JSON.stringify(ctsValidationReport, null, "\t"));
    }
    console.log("All good! SRT file successfully verified.");

  } catch (err) {

    console.error('Error:', err);

  }

}