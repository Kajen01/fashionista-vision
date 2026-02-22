import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIRS = [
    path.join(__dirname, 'backend/uploads/trialroom'),
    path.join(__dirname, 'backend/uploads/trialroom/results')
];

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanup() {
    console.log(`[${new Date().toISOString()}] Starting cleanup...`);

    UPLOAD_DIRS.forEach(dir => {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
                const age = Date.now() - stats.mtimeMs;
                if (age > MAX_AGE_MS) {
                    console.log(`Deleting old file: ${file}`);
                    fs.unlinkSync(filePath);
                }
            }
        });
    });

    console.log(`[${new Date().toISOString()}] Cleanup complete.`);
}

cleanup();
