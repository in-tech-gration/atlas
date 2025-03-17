import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";;
import { Command } from "commander";
import { ChatOllama } from "@langchain/ollama";
import { 
  getOllamaModels, 
  listPatterns, 
  OllamaError,
  selfUpdate, 
} from "../common/utils.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import chalk from 'chalk';
import prompts from "prompts";
import { PATTERNS_DIR } from "../common/config.js";

// import { listCalendarEvents } from "../plugins/google/calendar/calendar.js"

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class CLI {

  constructor({ version, config }) {
    this.version = version;
    this.config = config;
    this.model = null;
    this.platform = os.platform(); // 'win32', 'darwin', 'linux', etc.
    this.arch = os.arch(); // 'x64', 'arm', 'arm64'
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
      .option('-S, --setup', 'Run setup for all reconfigurable parts of atlas')
      .option('-l, --listpatterns', 'List all patterns')
      .option('--update', 'Update app version')
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

    const defaults = { temperature: 0.7 }
    const { model, temperature } = Object.assign(defaults, options);

    const chatModel = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model,
      temperature
    });

    this.model = model;
    this.chatModel = chatModel;

  }

  async execute({ options, program, stdin }) {

    if (options.listpatterns) {

      return listPatterns();

    }

    if (options.version) {
      return console.log(this.version);
    }

    if (options.setup) {

      if ( Object.keys(this.config.all).length > 0 ){
        console.log(chalk.gray("Current configuration:"));
        console.log(chalk.gray(JSON.stringify(this.config.all)));
      }

      let ollamaModels;

      try {

        ollamaModels = await getOllamaModels();

      } catch (error) {

        if (error instanceof OllamaError) {
          console.log(
            chalk.red("Error while trying to find Ollama. Is it installed on your system?")
          );
          return console.log(chalk.blue(`Check out ${chalk.bold("https://ollama.com/")}`));
        }

      }

      const questions = [
        {
          type: 'toggle',
          name: 'ollama_installed',
          message: 'Do you have Ollama installed?',
          initial: true,
          active: 'yes',
          inactive: 'no'
        },
        {
          type: prev => prev == true ? 'select' : null,
          name: 'ollama_model',
          message: 'Pick an Ollama model:',
          choices: ollamaModels.map(model => {
            return {
              title: model,
              value: model
            }
          }),
          initial: 1
        }
      ];

      const response = await prompts(questions);

      if (!response.ollama_installed) {
        return console.log("Please install Ollama and run the setup again");
      }
      if (!response.ollama_model) {
        return console.log("You must pick an Ollama model in order to use the LLM capabilities of atlas");
      }

      this.config.set('ollama_enabled', true);
      this.config.set('ollama_model', response.ollama_model);
      console.log("You've selected:", response.ollama_model);
      return;


    }

    if (options.update) {
      return selfUpdate();
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

      const patternFilePath = path.join(__dirname, "..", PATTERNS_DIR, pattern, "system.md");

      try {
        await fs.access(patternFilePath);
      } catch {
        return console.log(`Error initializing pattern: ${pattern}. Please check any misspellings.`);
      }

      const ollamaEnabled = this.config.get('ollama_enabled');
      const ollamaModel = this.config.get('ollama_model');

      if (!ollamaEnabled || !ollamaModel) {
        return console.log(chalk.redBright("You must select a language model in order to use the AI capabilities of atlas"));
      }

      return fs.readFile(patternFilePath, "utf8")
        .then(async (content) => {

          const llmOptions = {
            model: ollamaModel
          }

          if ("temperature" in options) {
            llmOptions.temperature = parseFloat(options.temperature);
          }

          this.initLLM(llmOptions);

          try {

            const response = await this.chatModel.invoke([
              new SystemMessage(content),
              new HumanMessage(stdin ? stdin : data)
            ]);

            console.log(response.content);

          } catch (error) {

            // Handle case where Ollama might not be running locally:
            const isChatOllama = this.chatModel instanceof ChatOllama;
            if (error.message === "fetch failed" && isChatOllama) {

              console.log(chalk.redBright("[ ERROR:LLM:INIT ]"), `Error trying to initialize ${chalk.bold(this.model)} model. \nPlease make sure that Ollama is running ${chalk.italic(`('ollama run ${this.model}')`)} and that the model is available.`);

              console.log(chalk.green("Troubleshooting:"), `Have you ran ${chalk.bold(`ollama pull ${this.model}`)} to download the model?`);

              console.log(chalk.redBright("(debug:info:initLLM)"));

            }

          }

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

    }

    program.help();

  }

}

