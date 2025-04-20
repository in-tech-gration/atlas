import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";;
import { Command, Option } from "commander";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import {
  getOllamaModels,
  listPatterns,
  displayPatternInfo,
  OllamaError,
  selfUpdate,
} from "../common/utils.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import chalk from 'chalk';
import prompts from "prompts";
import {
  ATLAS_PATTERNS_DIR,
  getAPIKey,
  LAMBDAS_DIR,
  PATTERNS_DIR,
  saveAPIKey,
} from "../common/config.js";
import { providers, models } from "../common/providers.js";
import clipboardy from 'clipboardy';
import runPlay from "../plugins/experimental/play.js";
import { ElevenLabsClient, play } from "elevenlabs";
import initializeLLM from "../common/llm.js";
import yoctoSpinner from 'yocto-spinner';
import matter from 'gray-matter';
// PLUGINS:
import mountUnmount from "../plugins/mount/index.js"
import srt2json from "../plugins/srt2json/index.js"
import YouTube from "../plugins/tools/youtube/youtube.js"
import web from "../plugins/web/index.js"

// import { listCalendarEvents } from "../plugins/google/calendar/calendar.js"

const __dirname = dirname(fileURLToPath(import.meta.url));

// Catch uncaught global errors
process.on("uncaughtException", (error) => {
  console.error(chalk.redBright(`${error}`));
  process.exit(1);
});

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
      .option('--context-window <size>', 'Set context window size (default: 2048)')
      .option('-S, --setup [type]', 'Run setup for all reconfigurable parts of atlas. Use -S model to only set up the model. Use -S show to display API keys.')
      .option('-l, --listpatterns [pattern]', 'List all patterns or find information about a particular pattern.')
      .option('--update', 'Update app version')
      .option('-c, --copy', 'Copy to clipboard')
      .option('-w, --web [search]', 'Search the web (using Tavily)')
      .option('--verbose', 'Verbose output (when available)')
      .option('--srt2json <file>', 'Convert SRT file to JSON')
      .option('--mount <state>', 'Mount/unmount one or more drives: --mount on|off|set (MacOS)')
      .option('-y, --youtube <url>', 'YouTube video URL to grab transcript')
      // TODO: Implement all fabric options:
      // -y, --youtube=                    YouTube video or play list "URL" to grab transcript, comments from it and send to chat or print it put to the console and store it in the output file
      // --playlist                    Prefer playlist over video if both ids are present in the URL
      // --transcript                  Grab transcript from YouTube video and send to chat (it is used per default).
      // --transcript-with-timestamps  Grab transcript from YouTube video with timestamps and send to chat
      // --comments                    Grab comments from YouTube video and send to chat
      // --metadata                    Output video metadata

      // TODO:
      // -s, --stream               Stream
      // -L, --listmodels           List all available models
      // -o, --output=              Output to file
      // Ref: https://github.com/danielmiessler/fabric/?tab=readme-ov-file#usage
      // .version(this.version)

      // Experimental:
      .addOption(new Option('--voice', 'Use speech synthesis').hideHelp())
      .addOption(new Option('--play [play]', 'Play your favorite music').hideHelp())
      .addOption(new Option('--describe <file>', 'Describe an image file').hideHelp())
      .addOption(new Option('--lambda <lambda_name>', 'Parse input through a lambda function').hideHelp())

    program.addHelpText('before', chalk.green.bold(`[[ Welcome to atlas v${this.version} ]]`));

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

      const numCtx = options.numCtx ? options.numCtx : 2048;

      chatModel = new ChatOllama({
        baseUrl: "http://localhost:11434",
        model,
        temperature,
        numCtx,
      });
      isSupported = true;

    }

    if (provider === "provider_open_ai") {

      chatModel = new ChatOpenAI({
        model,
        temperature,
      });
      isSupported = true;

    }

    if (provider === "provider_anthropic") {

      chatModel = new ChatAnthropic({
        model,
        temperature,
      });
      isSupported = true;

    }

    // https://js.langchain.com/docs/integrations/chat/google_generativeai/
    if (provider === "provider_gemini") {
      chatModel = new ChatGoogleGenerativeAI({
        model,
        temperature,
      });
      isSupported = true;
    }

    this.chatModel = chatModel;

    return { isSupported };

  }

  async execute({ options, program, stdin }) {

    if (options.srt2json) {
      return srt2json({ options, instance: this });
    }

    if (options.lambda) {

      const lambdaFile = options.lambda.split(":")[0];
      const arg = options.lambda.split(":")[1];

      let patternFilePath = path.join(__dirname, "..", LAMBDAS_DIR, "common", `${lambdaFile}.js`);

      try {

        await fs.access(patternFilePath);
        const { default: lambdaFunction } = await import(patternFilePath);
        process.stdout.write(lambdaFunction(stdin, arg));

      } catch (error) {

        console.log(error);

      }

      return;
    }

    if (options.listpatterns) {

      if (typeof options.listpatterns === "boolean") {
        return listPatterns();
      }
      if (typeof options.listpatterns === "string") {
        return displayPatternInfo(options.listpatterns);
      }

      return;

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
          console.log(chalk.blue(`Check out ${chalk.bold("https://ollama.com/")}`));
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
      const GOOGLE_API_KEY = getAPIKey("GOOGLE_API_KEY");
      const ELEVENLABS_API_KEY = getAPIKey("ELEVENLABS_API_KEY");

      const apiPromptType = options.setup === "show" ? "text" : "password";

      // https://github.com/terkelg/prompts?tab=readme-ov-file#-types
      const questions = [
        // PROVIDER SELECTION:
        {
          type: 'select',
          name: 'llm_provider',
          message: 'Pick your LLM provider',
          choices: (prev, all) => {
            if (!ollamaModels) {
              return providers.map(provider => {
                if (provider.value === "provider_ollama") {
                  provider.title = "Ollama [Not installed]";
                  provider.disabled = true;
                }
                return provider;
              });
            }
            return providers;
          },
          initial: () => {
            if (!currentLlmProvider) {
              return 0;
            }
            return providers.findIndex(provider => {
              return provider.value === currentLlmProvider;
            })
          },
        },
        // OLLAMA INSTALLATION CHECK:
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
        // MODEL SELECTION:
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
                title: model.name,
                value: model.name,
                description: model.description ? model.description : undefined,
              }
            });
          },
          initial: (prev, all) => {

            if (currentLlmProvider === all.llm_provider) {
              return models[currentLlmProvider].findIndex(model => {
                return model.name === currentModel;
              })
            }
            return 0;
          }
        },
        // OPENAI API KEY:
        {
          type: apiPromptType,
          name: 'openai_api_key',
          message: `[optional] Enter your OpenAI API KEY (leave empty to skip)`,
          initial: OPENAI_API_KEY
        },
        // TAVILY API KEY:
        {
          type: apiPromptType,
          name: 'tavily_api_key',
          message: `[optional] Enter your TAVILY API KEY (used in patterns that require Web search)(leave empty to skip)`,
          initial: TAVILY_API_KEY
        },
        // TOGETHER.AI API KEY:
        {
          type: apiPromptType,
          name: 'together_ai_api_key',
          message: `[optional] Enter your Together.AI API KEY (used for cloud access to LLMs)(leave empty to skip)`,
          initial: TOGETHER_AI_API_KEY
        },
        // GROQ API KEY:
        {
          type: apiPromptType,
          name: 'groq_api_key',
          message: `[optional] Enter your Groq API KEY (used for cloud access to LLMs)(leave empty to skip)`,
          initial: GROQ_API_KEY
        },
        // ANTHROPIC API KEY:
        {
          type: apiPromptType,
          name: 'anthropic_api_key',
          message: `[optional] Enter your Anthropic API KEY (leave empty to skip)`,
          initial: ANTHROPIC_API_KEY
        },
        // JINA API KEY:
        {
          type: apiPromptType,
          name: 'jina_api_key',
          message: `[optional] Enter your Jina.AI API KEY (leave empty to skip)`,
          initial: JINA_API_KEY
        },
        // GOOGLE API KEY:
        {
          type: apiPromptType,
          name: 'google_api_key',
          message: `[optional] Enter your Google API KEY (leave empty to skip)`,
          initial: GOOGLE_API_KEY
        },
        // ELEVEN LABS API KEY:
        {
          type: apiPromptType,
          name: 'elevenlabs_api_key',
          message: `[optional] Enter your Eleven Labs API KEY (leave empty to skip)`,
          initial: ELEVENLABS_API_KEY
        },
      ];

      const response = await prompts(questions, {
        onSubmit: (prompt, answer) => {
          // Abort Prompt chaining and return collected responses if the 
          // user has used the --setup, -S model option:
          if (prompt.name === "model" && options.setup === "model") {
            return true;
          }
        }
      });

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
      if (response.elevenlabs_api_key) {
        saveAPIKey("ELEVENLABS_API_KEY", response.elevenlabs_api_key);
      }

      if (response.google_api_key) {
        saveAPIKey("GOOGLE_API_KEY", response.google_api_key);
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

    if (options.model && typeof options.model === "boolean" && !options.pattern) {

      let llmProviderName;
      const llmProvider = this.config.get('llm_provider');

      if (llmProvider) {
        llmProviderName = providers.find(provider => {
          return provider.value === llmProvider;
        });
      }

      const model = this.config.get('model');

      if (llmProviderName) {
        console.log(`Selected provider: ${chalk.green(llmProviderName.title)}`);
      }

      if (model) {
        console.log(`Selected model: ${chalk.green(model)}`);
      }

      return;
    }

    if (options.web) {

      return web({ options, instance: this });

    }

    // PLUGIN: Mount/Unmount selected drives (Mac OS)
    if (options.mount) {
      return mountUnmount({ options, instance: this });
    }

    if (options.youtube) {
      return YouTube({ options, instance: this });
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

    // https://js.langchain.com/docs/how_to/multimodal_inputs/
    if (options.describe) {
      try {

        const { llmProvider, model } = initializeLLM({ instance: this, options });
        const chatModel = this.chatModel;
        const selectedModelDetails = models[llmProvider].find(m => {
          return m.name === model
        });

        if (!selectedModelDetails || !selectedModelDetails?.modality?.includes("images")) {
          throw new Error(`Model ${model} probably does not support images as input modality.`);
        }

        // console.log("Describe:", options.describe);
        const resolvedPath = path.resolve(options.describe);
        try {
          await fs.access(resolvedPath);
        } catch (error) {
          throw new Error(`File not found at path: ${resolvedPath}`);
        }
        const imageData = await fs.readFile(resolvedPath);
        const message = new HumanMessage({
          content: [
            {
              type: "text",
              text: "Please describe the image in full detail.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData.toString("base64")}`,
              },
            },
          ],
        });

        const spinner = yoctoSpinner({ text: `Analyzing image file: ${resolvedPath}...` }).start();
        const response = await chatModel.invoke([message]);
        spinner.success();
        console.log(response.content);

      } catch (error) {

        console.log(
          chalk.redBright("Error:", error.message)
        );

      }
      return;
    }

    if (options.pattern) {

      const [pattern, data] = options.pattern;

      if (!data && !stdin) {
        return console.log("Please provide some content.");
      }

      // First, check if the pattern exists in the primary patterns directory: patterns-atlas/
      let patternFilePath = path.join(__dirname, "..", ATLAS_PATTERNS_DIR, pattern, "system.md");

      try {

        await fs.access(patternFilePath);

      } catch {

        // If the pattern does not exist in the primary directory, check the alternative patterns directory: patterns/
        patternFilePath = path.join(__dirname, "..", PATTERNS_DIR, pattern, "system.md");

        try {
          await fs.access(patternFilePath);
        } catch {
          return console.log(`Error initializing pattern: ${pattern}. Neither primary nor alternative pattern files exist.`);
        }
      }

      const { llmProvider, model } = initializeLLM({ instance: this, options });

      return fs.readFile(patternFilePath, "utf8")
        .then(async (fileContent) => {

          const parsed = matter(fileContent);
          const hasFm = Object.keys(parsed.data).length > 0;
          // console.log( hasFm ? parsed.data : "No frontmatter found." );
          let content = parsed.content;

          try {

            // if ( content.match(/^INPUT:/m) ){
            //   content = content.replace(/^INPUT:/m, stdin ? stdin : data);
            // }
            // return console.log({ content });

            const regex = /{{(.*?)}}/g;
            const matches = content.match(regex);

            // [WiP] Find all {{...}} variables in the content and replace them based on the variables provided:
            // const variables = {};
            // matches.forEach(match => {
            //   const variableName = match.replace(/{{|}}/g, "").trim();
            //   variables[variableName] = data;
            // });
            // console.log(variables);

            // Replace all {{...}} with the data provided:
            if (matches && data) {
              content = content.replace(/{{(.*?)}}/g, data);
            }

            const systemMessage = new SystemMessage(content);
            const humanMessage = new HumanMessage(stdin ? stdin : data);

            const response = await this.chatModel.invoke([
              systemMessage,
              humanMessage,
            ]);

            let output;
            let totalInputLength = systemMessage.content.length + humanMessage.content.length;

            if (options.verbose) {
              console.log(chalk.gray("[VERBOSE OUTPUT ENABLED][ TOTAL INPUT LENGTH ]"));
              console.log(totalInputLength);
              console.log("\n");
            }

            // Check if the input length exceeds the context window (Ollama only):
            if (llmProvider === "provider_ollama") {
              let currentContextWindow = 2048;
              if (options.contextWindow) {
                currentContextWindow = parseInt(options.contextWindow);
              }
              if (totalInputLength > currentContextWindow) {
                console.log(chalk.redBright(`[ WARNING ] Your input (${totalInputLength}) is longer that the current context window (${currentContextWindow}). Please consider reducing the input size to fit the current context window or increasing the context window using the --context-window <size> option.`));
              }
            }

            if (
              llmProvider === "provider_ollama"
              || llmProvider === "provider_groq"
              || llmProvider === "provider_anthropic"
              || llmProvider === "provider_gemini"
            ) {
              output = response.content;
            } else {
              output = response;
            }

            if (options.verbose) {
              console.log(chalk.gray("[VERBOSE OUTPUT ENABLED][ RESPONSE ]"));
              console.log(response);
            } else {
              console.log(output);
            }

            if (options.voice) {
              // https://github.com/elevenlabs/elevenlabs-js
              const elevenlabs = new ElevenLabsClient({/* apiKey: "" */ });
              const audio = await elevenlabs.generate({
                voice: "Sarah",
                text: output,
                model_id: "eleven_multilingual_v2",
              });
              if (options.verbose) {
                // const usage = await elevenlabs.usage.getCharactersUsageMetrics({
                //   start_unix: 1,
                //   end_unix: 1
                // });
                // console.log({ usage });
              }
              await play(audio);
            }

            if (options.copy) {
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

    // EXPERIMENTAL:
    if (options.play) {
      return runPlay({ options, stdin });
    }

    program.help();

  }

}

