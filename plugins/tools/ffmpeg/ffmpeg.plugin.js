import path from "node:path";
import { execa } from 'execa';
import { text, select, confirm, tasks, spinner, isCancel } from '@clack/prompts';
import chalk from 'chalk';

async function extractWAV() {
  const inputFilename = await text({
    message: 'Enter filename:',
    validate: (value) => {
      if (!value) return 'Filename is required';
      return undefined;
    },
  });

  // const fileExtension = path.extname(inputFilename);
  const fileNameWithoutExtension = path.basename(inputFilename, path.extname(inputFilename));

  const outputExtension = "wav";

  if (isCancel(inputFilename)) {
    console.log('Operation cancelled');
    return;
  }

  // `$ ffmpeg -i video.flv -ab 320k output.mp3`
  const execaOptions = [
    '-i',
    inputFilename.replaceAll("'", "").trim(),
    `${fileNameWithoutExtension}.${outputExtension}`
  ]

  const cmd = "ffmpeg " + execaOptions.join(" ");

  await confirm({
    message: `Proceed with command: ${cmd}`,
  });

  const spin = spinner();
  spin.start(`Extracting WAV from file (${inputFilename})...`);

  await tasks([
    {
      title: 'Extracting WAV',
      task: async () => {
        // Extract partial audio from video

        try {
          // Start command but don't wait for it yet
          const extractPartialAudio = execa(
            'ffmpeg',
            execaOptions,
            // { stdio: "inherit" }
          );

          // Handle output as it arrives
          extractPartialAudio.stdout.on('data', (data) => {
            // Process each chunk of output
            console.log(data.toString().trim());
          });

          try {
            await extractPartialAudio;
          } catch (error) {
            console.error('Error:', error.message);
          }

        } catch (error) {

          console.log(error);

        }

        return 'WAV audio extraction finished';
      },
    },
  ]);

  spin.stop(`Audio file created: ${fileNameWithoutExtension}.${outputExtension}`);

}

async function extractMP3() {

  const inputFilename = await text({
    message: 'Enter filename:',
    validate: (value) => {
      if (!value) return 'Filename is required';
      return undefined;
    },
  });

  // const fileExtension = path.extname(inputFilename);
  const fileNameWithoutExtension = path.basename(inputFilename, path.extname(inputFilename));

  const outputExtension = "mp3";

  if (isCancel(inputFilename)) {
    console.log('Operation cancelled');
    return;
  }

  // `$ ffmpeg -i video.flv -ab 320k output.mp3`
  const execaOptions = [
    '-i',
    inputFilename.replaceAll("'", "").trim(),
    "-ab",
    "320k",
    `${fileNameWithoutExtension}.${outputExtension}`
  ]

  const cmd = "ffmpeg " + execaOptions.join(" ");

  await confirm({
    message: `Proceed with command: ${cmd}`,
  });

  const spin = spinner();
  spin.start(`Extracting MP3 from file (${inputFilename})...`);

  await tasks([
    {
      title: 'Extracting MP3',
      task: async () => {
        // Extract partial audio from video

        try {
          // Start command but don't wait for it yet
          const extractPartialAudio = execa(
            'ffmpeg',
            execaOptions,
            // { stdio: "inherit" }
          );

          // Handle output as it arrives
          extractPartialAudio.stdout.on('data', (data) => {
            // Process each chunk of output
            console.log(data.toString().trim());
          });

          try {
            await extractPartialAudio;
          } catch (error) {
            console.error('Error:', error.message);
          }

        } catch (error) {

          console.log(error);

        }

        return 'MP3 extraction finished';
      },
    },
  ]);

  spin.stop(`Audio file created: ${fileNameWithoutExtension}.${outputExtension}`);

}

async function extractPartialAudio() {

  const inputFilename = await text({
    message: 'Enter filename:',
    validate: (value) => {
      if (!value) return 'Filename is required';
      return undefined;
    },
  });

  const startTime = await text({
    message: 'Enter start time:',
    initialValue: "00:00",
    validate: (value) => {
      if (!value) return 'Start time is required';
      return undefined;
    },
  });

  const endTime = await text({
    message: 'Enter end time:',
    initialValue: "00:00",
    validate: (value) => {
      if (!value) return 'End time is required';
      return undefined;
    },
  });

  const fileExtension = path.extname(inputFilename);
  const fileNameWithoutExtension = path.basename(inputFilename, path.extname(inputFilename));

  const outputExtension = await text({
    message: 'Enter output format:',
    defaultValue: "m4a",
    initialValue: "m4a",
    validate: (value) => {
      // if (!value) return '';
      return undefined;
    },
  });

  if (
    isCancel(inputFilename)
    || isCancel(startTime)
    || isCancel(endTime)
    || isCancel(outputExtension)
  ) {
    console.log('Operation cancelled');
    return;
  }

  const execaOptions = [
    '-i',
    inputFilename.replaceAll("'", "").trim(),
    "-vn",
    "-acodec",
    "copy",
    "-ss",
    startTime,
    "-to",
    endTime,
    `${fileNameWithoutExtension}.${outputExtension}`
  ]

  const cmd = "ffmpeg " + execaOptions.join(" ");

  const confirmCommand = await confirm({
    message: `Proceed with command: ${cmd}`,
  });

  const spin = spinner();
  spin.start(`Extracting partial audio from video file (${inputFilename})...`);

  await tasks([
    {
      title: 'Extracting partial audio from video',
      task: async () => {
        // Extract partial audio from video

        try {
          // Start command but don't wait for it yet
          const extractPartialAudio = execa(
            'ffmpeg',
            execaOptions,
            // { stdio: "inherit" }
          );

          // Handle output as it arrives
          extractPartialAudio.stdout.on('data', (data) => {
            // Process each chunk of output
            console.log(data.toString().trim());
          });

          try {
            await extractPartialAudio;
          } catch (error) {
            console.error('Error:', error.message);
          }

        } catch (error) {

          console.log(error);

        }

        return 'Partial audio extraction finished';
      },
    },
    // {
    //   title: 'Task #2',
    //   task: async () => {
    //     return 'Task #2 Finished';
    //   },
    // },
  ]);

  spin.stop(`Audio file created: ${fileNameWithoutExtension}.${outputExtension}`);

}

async function trimEnd() {

  const inputFilenameRaw = await text({
    message: 'Enter filename:',
    validate: (value) => {
      if (!value) return 'Filename is required';
      return undefined;
    },
  });

  const inputFilename = inputFilenameRaw.replaceAll("'", "").replaceAll("\\ ", " ").trim();
  const fileExtension = path.extname(inputFilename);
  const fileNameWithoutExtension = path.basename(inputFilename, path.extname(inputFilename));

  const outputExtension = fileExtension.trim();

  if (isCancel(inputFilename)) {
    console.log('Operation cancelled');
    return;
  }

  const trimStart = await text({
    message: 'Enter timestamp trim point (end point):',
    validate: (value) => {
      if (!value) return 'Timestamp is required';
      return undefined;
    },
  });
  const trimmedFilename = `${fileNameWithoutExtension}-trimmed${outputExtension}`;
  const inputFileNameEscaped = inputFilename;

  // `ffmpeg -i input.mp4 -c:v copy -c:a copy -to 100 output.mp4`
  const execaOptions = [
    '-i',
    inputFileNameEscaped,
    '-c:v',
    'copy',
    '-c:a',
    'copy',
    '-to',
    trimStart,
    trimmedFilename,
  ]

  const cmd = "ffmpeg " + execaOptions.join(" ");

  const confirmCommand = await confirm({
    message: `Proceed with command: ${cmd}`,
  });

  const spin = spinner();
  spin.start(`Trimming file (${inputFilename})...`);

  await tasks([
    {
      title: 'Trimming',
      task: async () => {
        try {
          const trimEnd = execa(
            'ffmpeg',
            execaOptions,
            // { stdio: "inherit" }
          );

          // Handle output as it arrives
          trimEnd.stdout.on('data', (data) => {
            // Process each chunk of output
            console.log(data.toString().trim());
          });

          try {
            await trimEnd;
          } catch (error) {
            console.error('Error:', error.message);
          }

        } catch (error) {

          console.log(error);

        }

        return 'Trimming finished';
      },
    },
  ]);

  spin.stop(`Trimmed file created: ${trimmedFilename}`);

}

export default async function ffmpeg(options, globalOptions, cliInstance) {

  const { verbose: isVerbose } = globalOptions;

  console.log(
    chalk.bgYellowBright(chalk.bold.black("WARNING:")),
    "This feature is in",
    chalk.bgYellowBright(chalk.bold.black("(beta)")),
    "mode."
  );

  const action = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'extract_mp3', label: 'Extract MP3 audio', hint: '' },
      { value: 'extract_wav', label: 'Extract WAV audio', hint: '' },
      { value: 'extract_partial_audio', label: 'Extract partial audio from video', hint: '' },
      { value: 'trim_end', label: 'Trim end of file', hint: '' },
    ],
  });

  if (isCancel(action)) {
    console.log('Operation cancelled');
    process.exit(0);
  }

  if (action === 'exit') process.exit();

  switch (action) {

    case 'trim_end': {
      await trimEnd();
      break;
    }

    case 'extract_wav': {
      await extractWAV();
      break;
    }

    case 'extract_mp3': {
      await extractMP3();
      break;
    }

    case 'extract_partial_audio': {
      await extractPartialAudio();
      break;
    }

  }

}