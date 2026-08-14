import chalk from "chalk";
import Fuse from "fuse.js";
// ⚠️ TODO: Replace with custom path from configuration:
import db from "../_db_.json" with { type: "json" };
import clipboardy from 'clipboardy';

function database({ question, keys = ["question", "tags"], useTokenSearch = false }) {

  /**
   * @typedef FuseOptions 
   * @type {object}
   * @property {boolean} includeScore - Whether to include the score in the search results
   * @property {Array.<'question'|'tags'|'answer'|'references'|'category'|'author'>} keys  - The keys to search in the database
   */

  /**
   * @type {FuseOptions}
   */
  const fuseOptions = {
    useTokenSearch,
    includeScore: true,
    keys,
  }

  const fuse = new Fuse(db, fuseOptions);
  const result = fuse.search(question);
  return result;

}

// ⚠️ WORK IN PROGRESS
export default function askDatabase(options, globalOptions, cliInstance) {

  /**
   * @type {string} "simple search string" | "keyword[s]:html", "tag[s]:video,audio"
   */
  const question = options.ask.join(" ");
  let searchType = "generic";
  let answers = null;

  if (question === "help") {

    console.log();
    console.log(chalk.yellow("=================="));
    console.log(chalk.yellow("Available options:"));
    console.log(chalk.yellow("=================="));
    console.log("atlas --ask help");
    console.log("atlas --ask How can I trim an mp3 file?");
    console.log("atlas --ask keyword:term1,term2");
    console.log();
    return;

  }


  const matchParam = question.match(/(keyword|tag|answer|author|category)[s]?:\s*(?<value>.*)/i);

  if (matchParam) {

    const type = matchParam[1];
    const values = matchParam.groups.value.split(",");
    searchType = type;

    answers = database({
      question: values.join(" "),
      keys: ["question"],
      // TODO: Implement advanced search based on available keys (tags, answer, etc.)
      // keys: [type === "keyword" ? "question" : type],
    });

  } else {

    // const module = await import("../core/database.js");
    // const database = module.default;
    // const db = cliInstance.config.get('db.json');
    answers = database({ question });

  }

  console.log("======================");
  console.log(`Possible matches (${answers.length}):`);
  console.log(chalk.dim(`(Search Type: ${searchType})`));
  console.log("======================\n");

  answers.forEach((answer, index) => {

    const score = Math.floor(answer.score * 100);
    const scoreColor = score > 70 ? "green" : score > 50 ? "yellow" : "red";

    console.log(`Question: ${chalk.yellow(answer.item.question)}`);
    console.log(`Answer: ${chalk.green(answer.item.answer.join(""))}`);
    // console.log(`Score: ${chalk[scoreColor](score + "%")}`);
    if (index === 0) {
      console.log(chalk.cyan(`(Answer copied to clipboard)`));
    }
    console.log();

    // Copy first answer to clipboard
    if (index === 0) {
      clipboardy.writeSync(answer.item.answer.join(""));
    }

  });

}