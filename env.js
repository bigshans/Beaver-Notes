import dotenv from 'dotenv';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

// Resolve current directory path
const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadEnv(env) {
  const _env = dotenv.config({path: `${__dirname}/.env.${env}`, override: true});
  if (_env.parsed) {
    Object.assign(process.env, _env.parsed);
  }
}

// Load .env.development file
loadEnv('development');
