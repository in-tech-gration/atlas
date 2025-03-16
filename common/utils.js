import fs from "node:fs/promises";
import os from "node:os";
import path, { dirname } from "node:path";
import { PATTERNS_DIR } from "./config.js";
import { fileURLToPath } from "url";
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function listPatterns() {

  const patternsDir = path.join(__dirname, "..", PATTERNS_DIR);

  try {

    const entries = await fs.readdir(patternsDir, { withFileTypes: true });
    const patterns = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    console.log(patterns.join("\n"));

  } catch (err) {
    console.error("Error reading folder:", err);
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
            models.push(`${model}:${version}`)
          } else {
            models.push(`${folder}/${model}:${version}`);
          }
        }
      }
    }

    return models;
  }

  return listAllSubfolders(ollamaModelsManifestsDir);

}

function getAvailableOllamaModels(){

  const URL = "https://ollama-models.zwz.workers.dev/";

}

// Alternative solutions to updating the app:
// npm update -g atlas-fabric
// npm install -g atlas-fabric@latest
function selfUpdate() {
  try {
    execSync('npm install -g atlas-fabric@latest', { stdio: 'inherit' });
    console.log('Update complete!');
  } catch (error) {
    console.error('Update failed:', error);
  }
}
