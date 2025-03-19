import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";;
import { Command } from "commander";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { ChatGroq } from "@langchain/groq";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import {
  getOllamaModels,
  listPatterns,
  OllamaError,
  selfUpdate,
} from "../common/utils.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import chalk from 'chalk';
import prompts from "prompts";
import {
  getAPIKey,
  PATTERNS_DIR,
  saveAPIKey,
} from "../common/config.js";
import { providers, models } from "../common/providers.js";
import clipboardy from 'clipboardy';

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
      .option('-m, --model [model]', 'Choose model (or show currently selected model [without parameters')
      .option('-S, --setup', 'Run setup for all reconfigurable parts of atlas')
      .option('-l, --listpatterns', 'List all patterns')
      .option('--update', 'Update app version')
      .option('-c, --copy', 'Copy to clipboard')
      .option('-w, --web [search]', 'Search the web (using Tavily)')
      // TODO:
      // -s, --stream               Stream
      // -L, --listmodels           List all available models
      // -o, --output=              Output to file
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
    const { model, temperature, provider } = Object.assign(defaults, options);
    let isSupported = false;
    this.model = model;
    let chatModel;

    if (provider === "provider_together_ai") {

      chatModel = new TogetherAI({
        model,
        maxTokens: 256,
        temperature,
      });

      isSupported = true;

    }

    if (provider === "provider_groq") {

      try {
        
        chatModel = new ChatGroq({
          model,
          temperature,
          // maxTokens: undefined,
          // maxRetries: 2,
          // other params...
          // apiKey: 
        });
  
        isSupported = true;
        
      } catch (error) {
        
        return { isSupported: true, errorMessage: error.message }
        
      }

    }

    if (provider === "provider_ollama") {

      chatModel = new ChatOllama({
        baseUrl: "http://localhost:11434",
        model,
        temperature
      });
      isSupported = true;
    
    }

    if (provider === "provider_open_ai"){

      chatModel = new ChatOpenAI({
        model,
        temperature,
      });
      isSupported = true;

    }

    if (provider === "provider_anthropic"){

      chatModel = new ChatAnthropic({
        model,
        temperature,
      });
      isSupported = true;

    }

    this.chatModel = chatModel;

    return { isSupported };

  }

  async execute({ options, program, stdin }) {

    if (options.listpatterns) {

      return listPatterns();

    }

    if (options.version) {
      return console.log(this.version);
    }

    if (options.setup) {

      if (Object.keys(this.config.all).length > 0) {
        // console.log(chalk.gray("Current configuration:"));
        // console.log(chalk.gray(JSON.stringify(this.config.all)));
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

      models.provider_ollama = ollamaModels;

      const currentLlmProvider = this.config.get("llm_provider");
      const currentModel = this.config.get("model");

      const TAVILY_API_KEY = getAPIKey("TAVILY_API_KEY");
      const TOGETHER_AI_API_KEY = getAPIKey("TOGETHER_AI_API_KEY");
      const GROQ_API_KEY = getAPIKey("GROQ_API_KEY");
      const JINA_API_KEY = getAPIKey("JINA_API_KEY");
      const OPENAI_API_KEY = getAPIKey("OPENAI_API_KEY");
      const ANTHROPIC_API_KEY = getAPIKey("ANTHROPIC_API_KEY");

      // https://github.com/terkelg/prompts?tab=readme-ov-file#-types
      const questions = [
        {
          type: 'select',
          name: 'llm_provider',
          message: 'Pick your LLM provider',
          choices: providers,
          initial: () => {
            if (!currentLlmProvider) {
              return 0;
            }
            return providers.findIndex(provider => {
              return provider.value === currentLlmProvider;
            })
          },
        },
        {
          type: (prev, all) => {
            if (prev === "provider_ollama") {
              return 'toggle';
            }
            return null;
          },
          name: 'ollama_enabled',
          message: 'Do you have Ollama installed?',
          initial: !!this.config.get("ollama_enabled"),
          active: 'yes',
          inactive: 'no'
        },
        {
          type: 'select',
          name: 'model',
          message: (prev, all) => {
            const selectedProviderTitle = providers.find(provider => {
              return provider.value === all.llm_provider;
            })
            return `Pick a model from selected provider (${selectedProviderTitle.title}):`;
          },
          choices: (prev, all) => {
            return models[all.llm_provider].map(model => {
              return {
                title: model,
                value: model,
              }
            });
          },
          initial: (prev, all) => {
            if (currentLlmProvider === all.llm_provider) {
              return models[currentLlmProvider].findIndex(model => {
                return model === currentModel;
              })
            }
            return 0;
          }
        },
        {
          type: 'text',
          name: 'openai_api_key',
          message: `[optional] Enter your OpenAI API KEY`,
          initial: OPENAI_API_KEY
        },
        {
          type: 'text',
          name: 'tavily_api_key',
          message: `[optional] Enter your TAVILY API KEY (used in patterns that require Web search)`,
          initial: TAVILY_API_KEY
        },
        {
          type: 'text',
          name: 'together_ai_api_key',
          message: `[optional] Enter your Together.AI API KEY (used for cloud access to LLMs)`,
          initial: TOGETHER_AI_API_KEY
        },
        {
          type: 'text',
          name: 'groq_api_key',
          message: `[optional] Enter your Groq API KEY (used for cloud access to LLMs)`,
          initial: GROQ_API_KEY
        },
        {
          type: 'text',
          name: 'anthropic_api_key',
          message: `[optional] Enter your Anthropic API KEY`,
          initial: ANTHROPIC_API_KEY
        },
        {
          type: 'text',
          name: 'jina_api_key',
          message: `[optional] Enter your Jina.AI API KEY`,
          initial: JINA_API_KEY
        },
      ];

      const response = await prompts(questions);

      if (response.openai_api_key) {
        saveAPIKey("OPENAI_API_KEY", response.openai_api_key);
      }
      if (response.tavily_api_key) {
        saveAPIKey("TAVILY_API_KEY", response.tavily_api_key);
      }
      if (response.together_ai_api_key) {
        saveAPIKey("TOGETHER_AI_API_KEY", response.together_ai_api_key);
      }
      if (response.groq_api_key) {
        saveAPIKey("GROQ_API_KEY", response.groq_api_key);
      }
      if (response.jina_api_key) {
        saveAPIKey("JINA_API_KEY", response.jina_api_key);
      }
      if (response.anthropic_api_key) {
        saveAPIKey("ANTHROPIC_API_KEY", response.anthropic_api_key);
      }

      if (!response.llm_provider) {
        return console.log("You must select an LLM provider");
      }

      if (!response.model) {
        return console.log("You must pick a model in order to use the LLM capabilities of atlas");
      }

      if (response.ollama_enabled) {
        this.config.set('ollama_enabled', true);
      }

      this.config.set('llm_provider', response.llm_provider);
      this.config.set('model', response.model);
      console.log("You've selected:", response.model);

      return;


    }

    if (options.update) {
      return selfUpdate();
    }

    if (options.model && typeof options.model === "boolean"){
      
      let llmProviderName; 
      const llmProvider = this.config.get('llm_provider');

      if ( llmProvider ){
        llmProviderName = providers.find( provider =>{
          return provider.value === llmProvider;
        });
      }

      const model = this.config.get('model');

      if ( llmProviderName ){
        console.log(`Selected provider: ${chalk.green(llmProviderName.title)}`);
      }

      if ( model ){
        console.log(`Selected model: ${chalk.green(model)}`);
      }

      return;
    }

    if (options.web){

      if ( typeof options.web === "boolean" ){
        return console.log("Missing search context. Please provide some text to search the web.")
      }

      let tavilyTool;

      try {
        
        tavilyTool = new TavilySearchResults({
          maxResults: 3,
        });

      } catch (error) {

        console.log(chalk.redBright("Error:", error.message));

        if ( error.message.includes("No Tavily API key found") ){
          console.log(`Run ${chalk.blue("atlas -S")} to set up your API keys.`);
        }

        return;

      }

      const searchResults = await tavilyTool.invoke({
        input: options.web,
      });

      const searchResultsJSON = JSON.parse(searchResults);

      let output = `Here are some search results while searching the web for "${options.web}":`

      searchResultsJSON.forEach((result, index) =>{
        output += `\n\n`;
        output += `## Search result #${index}:\n\n`;
        output += `Title: ${result.title}\n`;
        output += `URL: ${result.url}\n`;
        output += `Content: ${result.content}`;
      });

      console.log(output);

      return;
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

      const llmProvider = this.config.get('llm_provider');
      const model = this.config.get('model');

      if (!llmProvider || !model) {
        return console.log(chalk.redBright("You must select a language model in order to use the AI capabilities of atlas"));
      }

      return fs.readFile(patternFilePath, "utf8")
        .then(async (content) => {

          const llmOptions = {
            provider: llmProvider,
            model
          }

          if ("temperature" in options) {
            llmOptions.temperature = parseFloat(options.temperature);
          }

          const { isSupported, errorMessage } = this.initLLM(llmOptions);

          if (!isSupported) {
            return console.log(`LLM Provider currently not supported. Please run ${chalk.bold("atlas -S")} and select supported provider.`);
          }

          if (errorMessage){
            return console.log(chalk.red(errorMessage));
          }

          try {

            // if ( content.match(/^INPUT:/m) ){
            //   content = content.replace(/^INPUT:/m, stdin ? stdin : data);
            // }
            // return console.log({ content });

            const response = await this.chatModel.invoke([
              new SystemMessage(content),
              new HumanMessage(stdin ? stdin : data)
            ]);

            let output;

            if (
              llmProvider === "provider_ollama" 
              || llmProvider === "provider_groq" 
              || llmProvider === "provider_anthropic"
            ) {
              output = response.content;
            } else {
              output = response;
            }

            console.log(output);

            if ( options.copy ){
              clipboardy.writeSync(output);
              console.log(chalk.gray("[Response copied to clipboard]"));
            }

          } catch (error) {

            // Handle case where Ollama might not be running locally:
            const isChatOllama = this.chatModel instanceof ChatOllama;
            if (error.message === "fetch failed" && isChatOllama) {

              console.log(chalk.redBright("[ ERROR:LLM:INIT ]"), `Error trying to initialize ${chalk.bold(this.model)} model. \nPlease make sure that Ollama is running ${chalk.italic(`('ollama run ${this.model}')`)} and that the model is available.`);

              console.log(chalk.green("Troubleshooting:"), `Have you ran ${chalk.bold(`ollama pull ${this.model}`)} to download the model?`);

              console.log(chalk.redBright("(debug:info:initLLM)"));

            } else {

              console.log(chalk.redBright("ERROR:", error));

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

