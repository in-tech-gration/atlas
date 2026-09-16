import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ATLAS_PATTERNS_DIR,
  PATTERNS_DIR,
} from "../common/config.js";
import initializeLLM from "../common/llm.js";
import matter from 'gray-matter';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import chalk from 'chalk';
import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";
import clipboardy from 'clipboardy';
import { ChatOllama } from "@langchain/ollama";
import { ChatAnthropic } from "@langchain/anthropic";

const __dirname = dirname(fileURLToPath(import.meta.url));

// console.log( await elevenlabs.voices.search() );
const elevenLabsVoices = {
  "Jarnathan Livingston": {
    id: 'PIGsltMj3gFMR34aFDI3',
    description: 'Jarnathan Livingston - authentic, calming and pleasing',
  },
  "Bella": {
    id: 'hpp4J3VqNfWAUOO0d1Us',
    description: 'Bella - Professional, Bright, Warm'
  },
  "Roger": {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    description: 'Roger - Laid-Back, Casual, Resonant'
  },
  "Sarah": {
    id: 'EXAVITQu4vr4xnSDxMaL',
    description: 'Sarah - Mature, Reassuring, Confident'
  },
  "Laura": {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    description: 'Laura - Enthusiast, Quirky Attitude'
  },
  "Charlie": {
    id: 'IKne3meq5aSn9XLyUdCD',
    description: 'Charlie - Deep, Confident, Energetic'
  },
  "George": {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    description: 'George - Warm, Captivating Storyteller'
  },
  "Callum": {
    id: 'N2lVS1w4EtoT3dr4eOWO',
    description: 'Callum - Husky Trickster'
  },
  "River": {
    id: 'SAz9YHcvj6GT2YYXdXww',
    description: 'River - Relaxed, Neutral, Informative'
  },
  "Harry": {
    id: 'SOYHLrjzK2X1ezoPC6cr',
    description: 'Harry - Fierce Warrior'
  }
}

export default async function patternLoader({ options, stdin, cliInstance }) {

  let [pattern, ...data] = options.pattern;
  if (Array.isArray(data)) data = data.join(" ");
  // console.log({ pattern, data });

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

  const { llmProvider, model } = initializeLLM({ instance: cliInstance, options });

  // TODO: Convert to async/await
  try {

    const fileContent = await fs.readFile(patternFilePath, "utf8");

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
      const humanMessage = new HumanMessage(`${data ? data : ""}\n${stdin ? stdin : ""}`);

      // console.log({ systemMessage, humanMessage });

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
          return 1;
        }
      }

      const response = await cliInstance.chatModel.invoke([
        systemMessage,
        humanMessage,
      ]);

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

        const voiceId = elevenLabsVoices["Bella"].id;

        try {

          const audio = await elevenlabs.textToSpeech.convert(voiceId, {
            outputFormat: "mp3_44100_128",
            text: output,
            modelId: "eleven_multilingual_v2",
          });

          if (options.verbose) {
            // const usage = await elevenlabs.usage.getCharactersUsageMetrics({
            //   start_unix: 1,
            //   end_unix: 1
            // });
            // console.log({ usage });
          }
          await play(audio);

        } catch (error) {

          const { statusCode, body: { detail: { message } } } = error;
          if (statusCode === 402) {
            console.log(`ElevenLabs API ERROR (CODE: 402): ${message}`);
          } else {
            console.log(error);
          }

        }
      }

      // Copy response to Clipboard
      if (options.copy) {
        clipboardy.writeSync(output);
        console.log(chalk.gray("[Response copied to clipboard]"));
      }

      // TODO: Write Response to file

    } catch (error) {

      // Handle case where Ollama might not be running locally:
      const isChatOllama = cliInstance.chatModel instanceof ChatOllama;
      // TODO: Move LLM-related code to the llm module:
      if (error.message === "fetch failed" && isChatOllama) {

        console.log(chalk.redBright("[ ERROR:LLM:INIT ]"), `Error trying to initialize ${chalk.bold(cliInstance.model)} model. \nPlease make sure that Ollama is running ${chalk.italic(`('ollama run ${cliInstance.model}')`)} and that the model is available.`);

        console.log(chalk.green("Troubleshooting:"), `Have you ran ${chalk.bold(`ollama pull ${cliInstance.model}`)} to download the model?`);

        console.log(chalk.redBright("(debug:info:initLLM)"));

      } else {

        // console.log(cliInstance.chatModel); 
        if (cliInstance.chatModel instanceof ChatAnthropic) {

          console.log(chalk.redBright("ERROR (ChatAntropic):", error.error.error.message));

          // GENERIC
        } else {

          if (options.verbose) {
            console.log(error);
          } else {
            console.log(chalk.redBright("ERROR:", error));
          }
        }

      }

    }

    // [ DEPRECATED ] In favour of simpler invocation with plain text input (see above)
    // const prompt = ChatPromptTemplate.fromMessages([
    //   ["system", content],
    //   ["human", stdin ? stdin : data],
    // ]);
    // const parser = new StringOutputParser();
    // const chain = prompt.pipe(cliInstance.chatModel).pipe(parser);
    // console.log(await chain.invoke());

  } catch (error) {

    console.log("File does not exist.", error);

  }

}