import chalk from "chalk";
import Fuse from "fuse.js";
// ⚠️ TODO: Replace with custom path from configuration:
import db from "../_db_.json" with { type: "json" };
import clipboardy from 'clipboardy';

function database({ question }) {

  const fuseOptions = {
    includeScore: true,
    keys: ['question', 'tags']
  }

  const fuse = new Fuse(db, fuseOptions)
  const result = fuse.search(question);
  return result;

}

/**
 * ⚠️ WORK IN PROGRESS
 */
export default function askDatabase(options, globalOptions, cliInstance) {

  const question = options.ask.join(" ");
  // const module = await import("../core/database.js");
  // const database = module.default;
  // const db = cliInstance.config.get('db.json');
  const answers = database({ question });

  console.log("=================");
  console.log("Possible matches:");
  console.log("=================");

  answers.forEach((answer, index) => {

    const score = Math.floor(answer.score * 100);
    const scoreColor = score > 70 ? "green" : score > 50 ? "yellow" : "red";

    console.log(`Question: ${chalk.yellow(answer.item.question)}`);
    console.log(`Answer: ${chalk.green(answer.item.answer.join(""))}`);
    // console.log(`Score: ${chalk[scoreColor](score + "%")}`);
    if ( index === 0 ){
      console.log(chalk.cyan(`(Answer copied to clipboard)`));
    }
    console.log();

    // Copy first answer to clipboard
    if (index === 0) {
      clipboardy.writeSync(answer.item.answer.join(""));
    }

  });

}