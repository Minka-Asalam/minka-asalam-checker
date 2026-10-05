// Settings: the worker's own .env first, then the app's files on this PC for the
// values that already live there (Supabase URL, YouTube and Gemini keys).
// Nothing here is ever printed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(HERE, '..');

function load(file) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[2].trim() && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

load(path.join(HERE, '.env'));
load('D:/Deeni/mobile/.env');
load('D:/Deeni/.env');

if (!process.env.SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL) process.env.SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing setting ${name} (see checker-worker/.env.example)`);
  return v;
}

// Where the listening script and the app checkout live on this PC.
export const DEENI = process.env.DEENI_DIR || 'D:/Deeni';
// Each check gets its own folder here (no spaces: the tools are called with paths).
export const RUNS = process.env.CHECKER_RUNS || 'D:/checker-runs/tab';
export const PIPELINE = path.join(REPO, 'pipeline');
