#!/usr/bin/env node
import CLI from "./cli/cli.js";
import { readFile } from 'fs/promises';
import Configstore from 'configstore';

const packageJson = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url))
);

// Create a Configstore instance and store in ~/.config/configstore/atlas-fabric.json
const config = new Configstore(packageJson.name, {});
// Other candidate: https://github.com/cosmiconfig/cosmiconfig

const atlas = new CLI({
  version: packageJson.version,
  config,
});
atlas.init();
