#!/usr/bin/env node
const VERSION = "v0.1.1";

import CLI from "./cli/cli.js";

const atlas = new CLI({ version: VERSION });
atlas.init();