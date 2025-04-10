import fs from "node:fs/promises";
import os from "node:os";
import path, { dirname } from "node:path";
import chalk from 'chalk';
import { ATLAS_PATTERNS_DIR, PATTERNS_DIR } from "./config.js";
import { fileURLToPath } from "url";
// import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getPatternsFromDir(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (err) {
    console.error(`Error reading folder ${dir}:`, err);
    return [];
  }
}

export async function listPatterns() {

  const primaryPatternsDir = path.join(__dirname, "..", ATLAS_PATTERNS_DIR);
  const secondaryPatternsDir = path.join(__dirname, "..", PATTERNS_DIR);

  const patterns1 = await getPatternsFromDir(primaryPatternsDir);
  const patterns2 = await getPatternsFromDir(secondaryPatternsDir);

  console.log("Available patterns:");
  console.log("===================");

  console.log(chalk.green.bold("Atlas Patterns:\n"));
  patterns1.forEach(pattern => {
    console.log("   " + chalk.green(pattern));
  });

  console.log(chalk.green.bold("\nFabric Patterns:\n"));
  patterns2.forEach(pattern => {
    console.log("   " + chalk.green(pattern));
  });
  // const allPatterns = [...patterns1, ...patterns2];
  // console.log(allPatterns.join("\n"));

}

export async function displayPatternInfo(pattern) {

  const primaryPatternsDirSearch = path.join(__dirname, "..", ATLAS_PATTERNS_DIR, `${pattern}/system.md`);
  const secondaryPatternsDirSearch = path.join(__dirname, "..", PATTERNS_DIR, `${pattern}/system.md`);

  try {
    const patternFileContents = await fs.readFile(primaryPatternsDirSearch, 'utf-8');
    return console.log(patternFileContents);
  } catch (err) {}

  try {
    const patternFileContents2 = await fs.readFile(secondaryPatternsDirSearch, 'utf-8');
    return console.log(patternFileContents2);
  } catch (err) {}

  console.log(chalk.red.bold("Pattern not found!"));

}

export class OllamaError extends Error {

  constructor({ message, code }) {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
  }

}

export async function getOllamaModels() {

  const homedir = os.homedir();

  // ✅ Mac: ~/.ollama/models
  // 🚧 Windows: C:\Users<username>.ollama\models
  // 🚧 Linux: /usr/share/ollama/.ollama/models
  // Reference: https://www.reddit.com/r/ollama/comments/1cl1lxy/file_path_of_models/

  const ollamaModelsManifestsDir = path.join(
    homedir,
    ".ollama",
    "models",
    "manifests",
    "registry.ollama.ai"
  );

  async function listFolders(dir) {

    const dirs = await fs.readdir(dir, { withFileTypes: true });
    return dirs.filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(dir, dirent.name));

  }

  async function listAllSubfolders(baseDir) {

    const models = [];
    const firstLevelFolders = await listFolders(baseDir);
    for (const folderPath of firstLevelFolders) {
      const folder = path.basename(folderPath);
      // console.log(`Folders inside ${folder}:`);
      const secondLevelFolders = await listFolders(folderPath);
      for (const secondLevelFolder of secondLevelFolders) {
        const versions = await fs.readdir((secondLevelFolder));
        const model = path.basename(secondLevelFolder);
        for (const version of versions) {
          if (folder === "library") {
            models.push({
              name: `${model}:${version}`
            })
          } else {
            models.push({ 
              name: `${folder}/${model}:${version}`
            });
          }
        }
      }
    }

    return models;
  }

  try {

    await fs.readdir(ollamaModelsManifestsDir);

  } catch {

    throw new OllamaError({
      code: "OLLAMA_DIR_MISSING",
      message: "Ollama registry could not be found."
    });

  }

  return listAllSubfolders(ollamaModelsManifestsDir);

}

function getAvailableOllamaModels() {

  const URL = "https://ollama-models.zwz.workers.dev/";

}

// Alternative solutions to updating the app:
// npm update -g atlas-fabric
export function selfUpdate() {

  console.log(
    `To update atlas, please run: ${chalk.green.bold("npm install -g atlas-fabric@latest")}`
  );

  // try {
  //   execSync('npm install -g atlas-fabric@latest', { stdio: 'inherit' });
  //   console.log('Update complete!');
  // } catch (error) {
  //   console.error('Update failed:', error);
  // }

}

/**
 * @link https://github.com/1c7/srt-parser-2/tree/master/src 
 */
export function srtToJSON(srt) {

  class Parser {
    seperator = ",";

    timestampToSeconds(srtTimestamp) {
      const [rest, millisecondsString] = srtTimestamp.split(",");
      const milliseconds = parseInt(millisecondsString);
      const [hours, minutes, seconds] = rest.split(":").map((x) => parseInt(x));
      const result = milliseconds * 0.001 + seconds + 60 * minutes + 3600 * hours;

      // fix odd JS roundings, e.g. timestamp '00:01:20,460' result is 80.46000000000001
      return Math.round(result * 1000) / 1000;
    };

    correctFormat(time) {
      // Fix the format if the format is wrong
      // 00:00:28.9670 Become 00:00:28,967
      // 00:00:28.967  Become 00:00:28,967
      // 00:00:28.96   Become 00:00:28,960
      // 00:00:28.9    Become 00:00:28,900

      // 00:00:28,96   Become 00:00:28,960
      // 00:00:28,9    Become 00:00:28,900
      // 00:00:28,0    Become 00:00:28,000
      // 00:00:28,01   Become 00:00:28,010
      // 0:00:10,500   Become 00:00:10,500
      let str = time.replace(".", ",");

      var hour = null;
      var minute = null;
      var second = null;
      var millisecond = null;

      // Handle millisecond
      var [front, ms] = str.split(",");
      millisecond = this.#fixed_str_digit(3, ms);

      // Handle hour
      var [a_hour, a_minute, a_second] = front.split(":");
      hour = this.#fixed_str_digit(2, a_hour, false);
      minute = this.#fixed_str_digit(2, a_minute, false);
      second = this.#fixed_str_digit(2, a_second, false);

      return `${hour}:${minute}:${second},${millisecond}`;
    }

    /*
    // make sure string is 'how_many_digit' long
    // if str is shorter than how_many_digit, pad with 0
    // if str is longer than how_many_digit, slice from the beginning
    // Example:
  
    Input: fixed_str_digit(3, '100')
    Output: 100
    Explain: unchanged, because "100" is 3 digit
  
    Input: fixed_str_digit(3, '50')
    Output: 500
    Explain: pad end with 0
  
    Input: fixed_str_digit(3, '50', false)
    Output: 050
    Explain: pad start with 0
  
    Input: fixed_str_digit(3, '7771')
    Output: 777
    Explain: slice from beginning
    */
    #fixed_str_digit(
      how_many_digit,
      str,
      padEnd = true
    ) {
      if (str.length == how_many_digit) {
        return str;
      }
      if (str.length > how_many_digit) {
        return str.slice(0, how_many_digit);
      }
      if (str.length < how_many_digit) {
        if (padEnd) {
          return str.padEnd(how_many_digit, "0");
        } else {
          return str.padStart(how_many_digit, "0");
        }
      }
    }

    #tryComma(data) {
      data = data.replace(/\r/g, "");
      var regex =
        /(\d+)\n(\d{1,2}:\d{1,2}:\d{1,2},\d{1,3}) --> (\d{1,2}:\d{1,2}:\d{1,2},\d{1,3})/g;
      let data_array = data.split(regex);
      data_array.shift(); // remove first '' in array
      return data_array;
    }

    #tryDot(data) {
      data = data.replace(/\r/g, "");
      var regex =
        /(\d+)\n(\d{1,2}:\d{1,2}:\d{1,2}\.\d{1,3}) --> (\d{1,2}:\d{1,2}:\d{1,2}\.\d{1,3})/g;
      let data_array = data.split(regex);
      data_array.shift(); // remove first '' in array
      this.seperator = ".";
      return data_array;
    }

    fromSrt(data) {
      var originalData = data;
      var data_array = this.#tryComma(originalData);
      if (data_array.length == 0) {
        data_array = this.#tryDot(originalData);
      }

      var items = [];
      for (var i = 0; i < data_array.length; i += 4) {
        const startTime = this.correctFormat(data_array[i + 1].trim());
        const endTime = this.correctFormat(data_array[i + 2].trim());
        var new_line = {
          id: data_array[i].trim(),
          startTime,
          startSeconds: this.timestampToSeconds(startTime),
          endTime,
          endSeconds: this.timestampToSeconds(endTime),
          text: data_array[i + 3].trim(),
        };
        items.push(new_line);
      }

      return items;
    }

    toSrt(data) {
      var res = "";

      const end_of_line = "\r\n";
      for (var i = 0; i < data.length; i++) {
        var s = data[i];
        res += s.id + end_of_line;
        res += s.startTime + " --> " + s.endTime + end_of_line;
        res += s.text.replace("\n", end_of_line) + end_of_line + end_of_line;
      }

      return res;
    }
  }

  const parser = new Parser();
  const srtArray = parser.fromSrt(srt);
  return srtArray;

  // export default Parser
  // export { Line }

}