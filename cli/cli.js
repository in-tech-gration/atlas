import { Command } from "commander";
import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import fs from "node:fs/promises";
import path from "path";

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
      // -p, --pattern              Choose a pattern from the available patterns
      .option('-p, --pattern <pattern...>', 'Choose a pattern from the available patterns')
      // -t, --temperature=         Set temperature (default: 0.7)
      .option('-t, --temperature [temperature]', 'Set temperature (default: 0.7)')
      // -m, --model
      .option('-m, --model [model]', 'Choose model')
      // TODO:
      // -s, --stream               Stream
      // -l, --listpatterns         List all patterns
      // -L, --listmodels           List all available models
      // -o, --output=              Output to file
      // -c, --copy                 Copy to clipboard
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

  initLLM(options){

    const defaults = { model: "llama3.1:latest", temperature: 0.7 }
    const { model, temperature } = Object.assign( defaults, options );

    const chatModel = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model,
      temperature
    });

    this.chatModel = chatModel;
    
  }

  execute({ options, program, stdin }) {

    if (options.pattern) {

      const [pattern, data] = options.pattern;

      if (!data && !stdin) {
        return console.log("Please provide some content.");
      }

      const filePath = path.join(PATTERNS_DIR, pattern, "system.md");

      fs.access(filePath)
        .then(() => fs.readFile(filePath, "utf8"))
        .then(async (content) => {

          const prompt = ChatPromptTemplate.fromMessages([
            ["system", content],
            ["human", stdin ? stdin : data],
          ]);

          const llmOptions = {}

          if ( "temperature" in options ){
            llmOptions.temperature = parseFloat(options.temperature);
          }

          this.initLLM(llmOptions);
          
          const parser = new StringOutputParser();
          const chain = prompt.pipe(this.chatModel).pipe(parser);
          console.log(await chain.invoke());

        })
        .catch((error) => {
          console.log("File does not exist.", error);
        });

    } else {

      program.help();

    }

  }

}

