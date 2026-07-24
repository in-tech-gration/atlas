import { execSync } from 'node:child_process';
import chalk from 'chalk';

/**
 * ⚠️ WORK IN PROGRESS
 */
export default async function whisper(options, globalOptions, cliInstance) {

  const execConfig = { encoding: 'utf8', timeout: 5000 };
  // ⚠️ TESTING via Llamafile:
  const whisperPath = "~/Applications/whisper-tiny.en.llamafile";
  const whisperVersion = execSync(
    `${whisperPath} --version`, 
    execConfig,
  );

  if ( !whisperVersion.startsWith("whisperfile v") ){
    return console.log("ERROR: whisper could not be found.");
  }

  const file = options[0];

  try {

    const result = execSync(
      `${whisperPath} --output-txt -f "${file}" > ${file}.transcript.txt`, 
      { encoding: 'utf8' }
    );
    console.log(chalk.green(`Finished transcribing ${file}.`));

  } catch (e){

    console.log(e);

  }

}