const { spawn } = require('child_process');
const path = require('path');

function printUsage() {
  console.log('Usage: node index.js [run <path-to-executable>]');
  console.log('Or: npm start');
  console.log('Examples:');
  console.log('  node index.js run ./my-app.exe');
  console.log('  node index.js run "%APP_PATH%\\app.exe"');
}

async function runNative(execPath, args = []) {
  const resolved = path.resolve(execPath);
  console.log(`Running native executable: ${resolved}`);

  const child = spawn(resolved, args, { stdio: 'inherit', shell: true });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`Process terminated with signal ${signal}`);
    } else {
      console.log(`Process exited with code ${code}`);
    }
  });

  child.on('error', (err) => {
    console.error('Failed to start process:', err.message);
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    printUsage();
    return;
  }

  const cmd = argv[0];
  if (cmd === 'run') {
    const execPath = argv[1];
    if (!execPath) {
      console.error('Error: missing path to executable.');
      printUsage();
      process.exit(1);
    }
    const args = argv.slice(2);
    await runNative(execPath, args);
  } else {
    printUsage();
  }
}

main();
