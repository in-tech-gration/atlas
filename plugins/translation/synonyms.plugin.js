import json from "./libs/synonyms.greek.js";
import clipboardy from "clipboardy";
import chalk from 'chalk';

export default async function synonyms(options, globalOptions, cliInstance) {

  const { verbose: isVerbose } = globalOptions;

  console.log(
    chalk.bgYellowBright(chalk.bold.black("WARNING:")),
    "This feature is in",
    chalk.bgYellowBright(chalk.bold.black("(beta)")),
    "mode."
  );

  const word = options[0]?.trim();

  if (!word) {
    return console.log("ERROR: Missing word");
  }

  const firstLetter = word[0].toUpperCase();
  const synonyms = json[firstLetter][word];
  console.log(
    `\nSynonyms for ${chalk.yellowBright(word)} => ${chalk.cyanBright(synonyms)} ${chalk.gray("(Copied to clipboard)")}\n`
  );
  clipboardy.writeSync(synonyms);

}
