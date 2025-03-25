import fs from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import * as dotenv from 'dotenv';

export const PATTERNS_DIR = "patterns";
export const ATLAS_PATTERNS_DIR = "patterns-atlas";
const ENV_PATH = join(homedir(), '.config', 'configstore', '.atlas-fabric.env');
dotenv.config({ path: ENV_PATH });

export function saveAPIKey(service, key) {

  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf8');
  }
  const lines = content.split('\n').filter(line => !line.startsWith(`${service}=`));
  lines.push(`${service}=${key}`);
  fs.writeFileSync(ENV_PATH, lines.join('\n'));
  // console.log(`✅ API key for ${service} saved in ${ENV_PATH}`);

}

export function getAPIKey(service) {
  return process.env[service] || null;
}

export function deleteAPIKey(service) {

  if (!fs.existsSync(ENV_PATH)) {
    return
  };
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n').filter(line => !line.startsWith(`${service}=`));
  fs.writeFileSync(ENV_PATH, lines.join('\n'));
  // console.log(`🗑️ API key for ${service} deleted.`);

}
