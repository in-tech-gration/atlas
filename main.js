#!/usr/bin/env node
import CLI from "./cli/cli.js";
import { readFile } from 'fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url))
);

const atlas = new CLI({ version: packageJson.version });
atlas.init();