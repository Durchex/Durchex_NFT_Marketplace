import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesDir = path.resolve(__dirname, 'routes');

const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.js'));

for (const file of routeFiles) {
  const routePath = path.join(routesDir, file);
  const routeUrl = pathToFileURL(routePath).href;
  process.stdout.write(`Importing ${file}... `);
  try {
    await import(routeUrl);
    console.log('OK');
  } catch (err) {
    console.log('FAILED');
    console.error(err.stack);
    process.exit(1);
  }
}
console.log('All route modules imported successfully.');
