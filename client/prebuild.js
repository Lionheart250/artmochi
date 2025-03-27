const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Remove package-lock.json if it exists
const lockFilePath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(lockFilePath)) {
  console.log('Removing existing package-lock.json');
  fs.unlinkSync(lockFilePath);
}

// Install dependencies without generating a lock file
console.log('Installing dependencies...');
try {
  execSync('npm install --no-package-lock --legacy-peer-deps', { stdio: 'inherit' });
  console.log('Dependency installation successful');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
}

// Run the build command
console.log('Building the application...');
try {
  execSync('NODE_ENV=production REACT_APP_ENV=production GENERATE_SOURCEMAP=false react-scripts build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}