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
  } catch (err) {
    console.log(err);
  }

  try {
    const patternFileContents2 = await fs.readFile(secondaryPatternsDirSearch, 'utf-8');
    return console.log(patternFileContents2);
  } catch (err) {
    console.log(err);
  }

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