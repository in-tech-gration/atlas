import { TextPrompt, isCancel } from '@clack/core';
import { confirm, select } from '@clack/prompts';

export function hhmmssToSeconds(hhmmss) {

  if (hhmmss.trim() === "") {
    return 0;
  }

  const regex = /^(\d{1,2}:)?(\d{1,2}:)?\d{1,2}$/;

  if (!regex.test(hhmmss)) {
    throw new Error('Invalid input format. Expected HH:MM:SS, MM:SS, or SS.');
  }

  const splitInput = hhmmss.split(':');

  if (splitInput.length === 1) {
    splitInput.unshift(0);
  }

  if (splitInput.length === 2) {
    splitInput.unshift(0);
  }

  const HH = (+splitInput[0]) * 60 * 60;
  const MM = (+splitInput[1]) * 60;
  const SS = (+splitInput[2]);

  const seconds = HH + MM + SS;

  return seconds;

}

export function secondsToHHMMSS(seconds) {

  return new Date(seconds * 1000).toISOString().slice(11, 19);

}

export default async function converter(options, globalOptions, cliInstance) {

  if (options.length !== 0) {
    // console.log({ options });
    return 0;
  }

  const conversionType = await select({
    message: 'Pick conversion type:',
    options: [
      { value: 'hhmmss-to-seconds', label: 'HH:MM:SS to seconds', hint: '' },
      { value: 'seconds-to-hhmmss', label: 'Seconds to HH:MM:SS', hint: '' },
    ],
    maxItems: 10, // Maximum number of items to display at once
  });

  const textPrompt = new TextPrompt({
    render() {
      return `Paste input: \n${this.userInputWithCursor}`;
    },
  });

  const input = await textPrompt.prompt();

  if (isCancel(input)) {
    process.exit(0);
  }

  if (conversionType === 'hhmmss-to-seconds') {

    const result = hhmmssToSeconds(input);
    return console.log(result);

  }

  if (conversionType === "seconds-to-hhmmss") {
    const result = secondsToHHMMSS(input);
    return console.log(result);
  }


  return 0;

}