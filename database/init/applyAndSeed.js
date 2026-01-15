#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

function runCmd(command, args, options = {}) {
  console.log(`\n$ ${[command].concat(args).join(' ')}`);
  const res = spawnSync(command, args, { stdio: 'inherit', shell: true, ...options });
  return res.status === 0;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const salesforceDir = path.join(__dirname, 'salesforce');
  const createMeta = path.join(salesforceDir, 'createMetadata.js');
  const recreateMeta = path.join(salesforceDir, 'recreateMetadata.js');
  const seedRunner = path.join(__dirname, 'runSeed.js');

  // Step 1: run non-destructive updater (apply)
  console.log('\n==> Running non-destructive metadata updater (apply)');
  const okCreate = runCmd('node', [createMeta, '--apply', '--confirm'], { cwd: repoRoot });

  // Wait 60 seconds for metadata propagation
  console.log('\nWaiting 60 seconds for metadata propagation...');
  await sleep(60 * 1000);

  // Step 2: run seed
  console.log('\n==> Running Salesforce seed (USE_SALESFORCE=1)');
  const seedOk = runCmd('node', [seedRunner], { cwd: repoRoot, env: { ...process.env, USE_SALESFORCE: '1' } });

  if (seedOk) {
    console.log('\n✅ Seed completed successfully after updater.');
    process.exit(0);
  }

  console.warn('\nSeed failed after updater. Will attempt destructive recreate and retry seeding.');

  // Step 3: destructive recreate
  console.log('\n==> Running destructive recreate of CustomObjects (this will DELETE data)');
  const okRecreate = runCmd('node', [recreateMeta, '--confirm'], { cwd: repoRoot });
  if (!okRecreate) {
    console.error('Destructive recreate failed. Aborting.');
    process.exit(2);
  }

  // Wait again for propagation after recreate
  console.log('\nWaiting 60 seconds after recreate for metadata propagation...');
  await sleep(60 * 1000);

  // Step 4: run seed again
  console.log('\n==> Re-running Salesforce seed (USE_SALESFORCE=1) after recreate');
  const seedOk2 = runCmd('node', [seedRunner], { cwd: repoRoot, env: { ...process.env, USE_SALESFORCE: '1' } });
  if (!seedOk2) {
    console.error('\n❌ Seed still failed after destructive recreate. Inspect the org and metadata manually.');
    process.exit(3);
  }

  console.log('\n✅ Seed succeeded after destructive recreate.');
  process.exit(0);
}

main().catch(err => {
  console.error('Unexpected error in applyAndSeed:', err && err.stack ? err.stack : err);
  process.exit(2);
});