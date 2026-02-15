const { execSync } = require('child_process');
try {
    const result = execSync('npx vite build', { encoding: 'utf8', stdio: 'pipe' });
    console.log('BUILD OK');
    console.log(result.slice(-300));
} catch (e) {
    console.log('BUILD FAILED');
    console.log('=== STDOUT (last 800 chars) ===');
    console.log(e.stdout ? e.stdout.slice(-800) : 'none');
    console.log('=== STDERR (last 800 chars) ===');
    console.log(e.stderr ? e.stderr.slice(-800) : 'none');
}
