import fs from 'fs';
import path from 'path';

const ML_SERVICE_URL = 'http://127.0.0.1:8002';

async function testML() {
    try {
        console.log("Testing ML Service Pose...");
        const formData = new FormData();
        // Assuming there is some image in uploads/trialroom or use a garment
        const dummyPath = './assets/garments/dress1.png';
        const buffer = fs.readFileSync(dummyPath);
        formData.append('file', new Blob([buffer]), 'test.png');

        const response = await fetch(`${ML_SERVICE_URL}/pose`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log("Pose Response:", data);

        if (data.error) {
            console.error("ML Service returned error:", data.error);
        }
    } catch (err) {
        console.error("ML Service Test Failed:", err.message);
    }
}

async function testTryOn() {
    try {
        console.log("Testing ML Service TryOn...");
        const formData = new FormData();
        const userPath = './assets/garments/dress1.png'; // Using a garment as user test
        const garmentPath = './assets/garments/dress1.png';

        formData.append('user_image', new Blob([fs.readFileSync(userPath)]), 'user.png');
        formData.append('garment_image', new Blob([fs.readFileSync(garmentPath)]), 'garment.png');
        formData.append('params', JSON.stringify({ scale: 1.15, xOffset: 0, yOffset: 0, rotation: 0 }));

        const response = await fetch(`${ML_SERVICE_URL}/tryon`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log("TryOn Response:", data ? data.tryon_image?.substring(0, 50) + "..." : "null");

        if (data.error) {
            console.error("ML Service returned error:", data.error);
        }
    } catch (err) {
        console.error("ML Service TryOn Test Failed:", err.message);
    }
}

testML().then(() => testTryOn());
