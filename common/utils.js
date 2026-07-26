import { statSync } from 'node:fs'
import { stat } from 'node:fs/promises';
import fs from "node:fs/promises";
import os from "node:os";
import path, { dirname, delimiter, join, sep, posix } from "node:path";
import crypto from 'node:crypto';
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

export async function getFileHash(filePath, algorithm = 'sha256') {

  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash(algorithm).update(fileBuffer).digest('hex');

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
 * @link Based on: https://github.com/npm/node-which and https://github.com/isaacs/isexe
 * @description Usage: which.sync("ollama"); await which("ollama");
 */
export const which = (function initWhich(){

  // posix.js
  /**
   * This is the Posix implementation of isexe, which uses the file
   * mode and uid/gid values.
   *
   * @module
   */
  const posix = {
  
    /**
     * Determine whether a path is executable according to the mode and
     * current (or specified) user and group IDs.
     */
    async isExe(path, options = {}) {
      const { ignoreErrors = false } = options;
      try {
        return this.checkStat(await stat(path), options);
      }
      catch (e) {
        const er = e;
        if (ignoreErrors || er.code === 'EACCES')
          return false;
        throw er;
      }
    },
    /**
     * Synchronously determine whether a path is executable according to
     * the mode and current (or specified) user and group IDs.
     */
    sync(path, options = {}) {
  
      const { ignoreErrors = false } = options;
      try {
        const fileStatus = statSync(path);
        const statResults = this.checkStat(fileStatus, options);
        return statResults;
      }
      catch (e) {
        const er = e;
        if (ignoreErrors || er.code === 'EACCES')
          return false;
        throw er;
      }
    },
  
    checkStat(stat, options) {
      try {
        const isFile = stat.isFile();
        const isCheckMode = this.checkMode(stat, options);
        return isFile && isCheckMode;
      } catch (error) {
        console.log(error);
      }
    },
  
    checkMode(stat, options) {
      const myUid = options.uid ?? process.getuid?.();
      const myGroups = options.groups ?? process.getgroups?.() ?? [];
      const myGid = options.gid ?? process.getgid?.() ?? myGroups[0];
      if (myUid === undefined || myGid === undefined) {
        throw new Error('cannot get uid or gid');
      }
      const groups = new Set([myGid, ...myGroups]);
      const mod = stat.mode;
      const uid = stat.uid;
      const gid = stat.gid;
      const u = parseInt('100', 8);
      const g = parseInt('010', 8);
      const o = parseInt('001', 8);
      const ug = u | g;
      return !!(mod & o ||
        (mod & g && groups.has(gid)) ||
        (mod & u && uid === myUid) ||
        (mod & ug && myUid === 0));
    }
  
  }
  
  // win32.js
  /**
   * This is the Windows implementation of isexe, which uses the file
   * extension and PATHEXT setting.
   *
   * @module
   */
  const win32 = {
  
    /**
     * Determine whether a path is executable based on the file extension
     * and PATHEXT environment variable (or specified pathExt option)
     */
    async isExe(path, options = {}) {
      const { ignoreErrors = false } = options;
      try {
        return this.checkStat(await stat(path), path, options);
      }
      catch (e) {
        const er = e;
        if (ignoreErrors || er.code === 'EACCES')
          return false;
        throw er;
      }
    },
    /**
     * Synchronously determine whether a path is executable based on the file
     * extension and PATHEXT environment variable (or specified pathExt option)
     */
    sync(path, options = {}) {
      const { ignoreErrors = false } = options;
      try {
        return this.checkStat(statSync(path), path, options);
      }
      catch (e) {
        const er = e;
        if (ignoreErrors || er.code === 'EACCES')
          return false;
        throw er;
      }
    },
  
    checkPathExt(path, options) {
      const { pathExt = process.env.PATHEXT || '' } = options;
      const peSplit = pathExt.split(delimiter);
      if (peSplit.indexOf('') !== -1) {
        return true;
      }
      for (const pes of peSplit) {
        const p = pes.toLowerCase();
        const ext = path.substring(path.length - p.length).toLowerCase();
        if (p && ext === p) {
          return true;
        }
      }
      return false;
    },
  
    checkStat(stat, path, options) {
      return stat.isFile() && this.checkPathExt(path, options);
    }
  
  }
  
  // isexe/index.js
  // import * as posix from './posix.js';
  // import * as win32 from './win32.js';
  // export * from './options.js';
  // export { win32, posix };
  const platform = process.env._ISEXE_TEST_PLATFORM_ || process.platform;
  const impl = platform === 'win32' ? win32 : posix;
  
  const isWindows = process.platform === 'win32'
  
  // used to check for slashed in commands passed in. always checks for the posix
  // seperator on all platforms, and checks for the current separator when not on
  // a posix platform. don't use the isWindows check for this since that is mocked
  // in tests but we still need the code to actually work when called. that is also
  // why it is ignored from coverage.
  /* istanbul ignore next */
  const rSlash = new RegExp(`[${posix.sep}${sep === posix.sep ? '' : sep}]`.replace(/(\\)/g, '\\$1'))
  const rRel = new RegExp(`^\\.${rSlash.source}`)
  
  const getNotFoundError = (cmd) => {
    return Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' })
  }
  
  const getPathInfo = (cmd, {
    path: optPath = process.env.PATH,
    pathExt: optPathExt = process.env.PATHEXT,
    delimiter: optDelimiter = delimiter,
  }) => {
  
    // If it has a slash, then we don't bother searching the pathenv.
    // just check the file itself, and that's it.
    const matchRSlash = null;
    // const matchRSlash = cmd.match(rSlash); // ⚠️
    const pathEnv = matchRSlash ? [''] : [
      // windows always checks the cwd first
      ...(isWindows ? [process.cwd()] : []),
      ...(optPath || /* istanbul ignore next: very unusual */ '').split(optDelimiter),
    ]
  
    if (isWindows) {
      const pathExtExe = optPathExt ||
        ['.EXE', '.CMD', '.BAT', '.COM'].join(optDelimiter)
      const pathExt = pathExtExe.split(optDelimiter).flatMap((item) => [item, item.toLowerCase()])
      if (cmd.includes('.') && pathExt[0] !== '') {
        pathExt.unshift('')
      }
      return { pathEnv, pathExt, pathExtExe }
    }
  
    return { pathEnv, pathExt: [''] }
  }
  
  const getPathPart = (raw, cmd) => {
    const pathPart = /^".*"$/.test(raw) ? raw.slice(1, -1) : raw
    const prefix = !pathPart && rRel.test(cmd) ? cmd.slice(0, 2) : ''
    return prefix + join(pathPart, cmd)
  }
  
  const which = async (cmd, opt = {}) => {

    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
    const found = []
  
    for (const envPart of pathEnv) {
      const p = getPathPart(envPart, cmd)
  
      for (const ext of pathExt) {
        const withExt = p + ext
        /**
         * Determine whether a path is executable on the current platform.
         */
        const is = await impl.isExe(withExt, { pathExt: pathExtExe, ignoreErrors: true })
        if (is) {
          if (!opt.all) {
            return withExt
          }
          found.push(withExt)
        }
      }
    }
  
    if (opt.all && found.length) {
      return found
    }
  
    if (opt.nothrow) {
      return null
    }
  
    throw getNotFoundError(cmd)
  }
  
  const whichSync = (cmd, opt = {}) => {
  
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
    const found = []
  
    for (const pathEnvPart of pathEnv) {
  
      const pathPart = getPathPart(pathEnvPart, cmd);
  
      for (const ext of pathExt) {
  
        const withExt = pathPart + ext
        /**
         * Synchronously determine whether a path is executable on the
         * current platform.
         */
        const is = impl.sync(withExt, { pathExt: pathExtExe, ignoreErrors: true })
  
        if (is) {
          if (!opt.all) {
            return withExt
          }
          found.push(withExt)
        }
      }
    }
  
    if (opt.all && found.length) {
      return found
    }
  
    if (opt.nothrow) {
      return null
    }
  
    throw getNotFoundError(cmd)
  }
  
  which.sync = whichSync;

  return which;
  
}());