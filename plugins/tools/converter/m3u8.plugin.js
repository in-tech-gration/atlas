import { TextPrompt, isCancel } from '@clack/core';
import { confirm, select } from '@clack/prompts';
import { execa } from 'execa';

export default async function m3u8Download(options, globalOptions, cliInstance) {

  const textPrompt = new TextPrompt({
    render() {
      return `Paste the full m3u8 URL: \n${this.userInputWithCursor}`;
    },
  });

  const m3u8 = await textPrompt.prompt();

  if (isCancel(m3u8)) {
    process.exit(0);
  }

  const outputFormat = await select({
    message: 'Pick an output format',
    options: [
      { value: 'mp4', label: 'mp4', hint: '' },
      { value: 'mp3', label: 'mp3', hint: '' },
      { value: 'webm', label: 'WebM', hint: '' },
    ],
    maxItems: 5, // Maximum number of items to display at once
  });

  const outputNamePrompt = new TextPrompt({
    render() {
      return `Enter output filename: \n${this.userInputWithCursor}`;
    },
  });

  const outputName = await outputNamePrompt.prompt();

  if (isCancel(m3u8)) {
    process.exit(0);
  }

  const execaOptions = [
    '-i',
    m3u8,
    "-c",
    "copy",
    `${outputName.replaceAll(" ", ".")}.${outputFormat}`
  ]

  const cmd = execaOptions.join(" ");

  const shouldProceed = await confirm({
    message: `Do you want to proceed with the following command? ${cmd}`,
  });

  if (shouldProceed) {

    try {


      // Start command but don't wait for it yet
      const findProcess = execa(
        'ffmpeg',
        execaOptions,
        { stdio: "inherit" }
      );

      // Handle output as it arrives
      findProcess.stdout.on('data', (data) => {
        // Process each chunk of output
        console.log(data.toString().trim());
      });

      try {
        // Wait for command to complete
        await findProcess;
        console.log('Command completed');
      } catch (error) {
        console.error('Error:', error.message);
      }

    } catch (error) {

      console.log(error);

    }

  }


}