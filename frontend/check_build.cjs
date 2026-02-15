const { execSync } = require('child_process');
try {
    const result = execSync('npx vite build', { encoding: 'utf8', stdio: 'pipe' });
    console.log('BUILD OK');
} catch (e) {
    console.log('BUILD FAILED');
    if (e.stdout) console.log(e.stdout.slice(-800));
    if (e.stderr) console.log(e.stderr.slice(-800));
}
