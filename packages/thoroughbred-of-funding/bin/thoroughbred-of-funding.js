#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { main } from 'fairdrive-core';
import { manifest } from '../src/manifest.js';
import { demo } from '../src/demo.js';

main(manifest, { bin: 'thoroughbred-of-funding', demo, evalFile: fileURLToPath(new URL('../evals/cases.json', import.meta.url)) });
