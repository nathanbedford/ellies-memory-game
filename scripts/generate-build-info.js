import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get commit hash from Vercel env var or fall back to git command
let commitHash = process.env.VERCEL_GIT_COMMIT_SHA;

if (!commitHash) {
  try {
    commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    // If git command fails, use a placeholder
    commitHash = 'unknown';
  }
}

// Generate build timestamp
const buildTime = new Date().toISOString();

// Create build info object
const buildInfo = {
  commitHash,
  buildTime,
};

// Write to src/build-info.json
const outputPath = join(__dirname, '..', 'src', 'build-info.json');
writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log(`Build info generated: ${outputPath}`);
console.log(`  Commit: ${commitHash}`);
console.log(`  Build time: ${buildTime}`);

