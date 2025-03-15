import fs from "node:fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Command } from "commander";
import { ChatOllama } from "@langchain/ollama";
import { listSubfolders } from "../common/utils.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// import { listCalendarEvents } from "../plugins/google/calendar/calendar.js"
import { VERSION } from "../main.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PATTERNS_DIR = "patterns";

export default class CLI {

  constructor({ version }) {
    this.version = version;
  }

  init() {

    const program = new Command();

    program
      .name("atlas")
      .description("atlas-fabric is an open-source framework for augmenting humans using AI.")
      .option("-v, --version", "Display version") // Overrides fabric option
      // .option("--calendar", "Experimental calendar feature") // WiP
      // .option('--chat', 'Start a chat session') // WiP
      .option('-p, --pattern <pattern...>', 'Choose a pattern from the available patterns')
      .option('-t, --temperature [temperature]', 'Set temperature (default: 0.7)')
      .option('-m, --model [model]', 'Choose model')
      .option('-l, --listpatterns', 'List all patterns')
      // TODO:
      // -s, --stream               Stream
      // -L, --listmodels           List all available models
      // -o, --output=              Output to file
      // -c, --copy                 Copy to clipboard
      // Ref: https://github.com/danielmiessler/fabric/?tab=readme-ov-file#usage
      .version(this.VERSION)

    let stdin = "";

    if (process.stdin.isTTY) {

      program.parse(process.argv);
      const options = program.opts();
      this.execute({ options, program });

      // HANDLE PIPED CONTENT: cat file.txt | atlas -p pattern
      // https://github.com/tj/commander.js/issues/137
    } else {

      process.stdin.on("readable", () => {
        let chunk = process.stdin.read();
        if (chunk !== null) {
          stdin += chunk;
        }
      });
      process.stdin.on("end", () => {
        program.parse(process.argv);
        const options = program.opts();
        this.execute({ options, program, stdin });
      });

    }

  }

  initLLM(options) {

    const defaults = { model: "llama3.1:latest", temperature: 0.7 }
    const { model, temperature } = Object.assign(defaults, options);

    const chatModel = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model,
      temperature
    });

    this.chatModel = chatModel;

  }

  execute({ options, program, stdin }) {

    if (options.listpatterns) {

      const patternsDir = path.join(__dirname, "..", PATTERNS_DIR);
      return listSubfolders(patternsDir);

    }

    if (options.version){
      return console.log(VERSION);
    }
    // WiP
    // if (options.chat){
    //   return console.log("Chatting...");
    // }

    // WiP
    // if (options.calendar) {
    //   console.log("Google Calendar:");
    //   listCalendarEvents({ maxResults: 12 });
    //   return;
    // }

    if (options.pattern) {

      const [pattern, data] = options.pattern;

      if (!data && !stdin) {
        return console.log("Please provide some content.");
      }

      const filePath = path.join(__dirname, "..", PATTERNS_DIR, pattern, "system.md");

      fs.access(filePath)
        .then(() => fs.readFile(filePath, "utf8"))
        .then(async (content) => {

          const llmOptions = {}

          if ("temperature" in options) {
            llmOptions.temperature = parseFloat(options.temperature);
          }

          this.initLLM(llmOptions);

          const response = await this.chatModel.invoke([
            new SystemMessage(content),
            new HumanMessage(stdin ? stdin : data)
          ]);

          console.log(response.content);

          // [ DEPRECATED ] In favour of simpler invocation with plain text input (see above)
          // const prompt = ChatPromptTemplate.fromMessages([
          //   ["system", content],
          //   ["human", stdin ? stdin : data],
          // ]);
          // const parser = new StringOutputParser();
          // const chain = prompt.pipe(this.chatModel).pipe(parser);
          // console.log(await chain.invoke());

        })
        .catch((error) => {
          console.log("File does not exist.", error);
        });

    } else {

      program.help();

    }

  }

}

