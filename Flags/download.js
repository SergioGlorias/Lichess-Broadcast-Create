// Ler feds.csv file (comma separated values, no header, columns: url, code)
// Download svgs from urls in feds.csv
// rename svgs to ${code}.svg
// Save svgs to svgs/ folder

const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, 'feds.csv');
const outputDir = path.join(__dirname, 'svgs');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Read feds.csv file
const data = fs.readFileSync(inputFilePath, 'utf8');

// Split data into lines
const lines = data.trim().split('\n');

// Function to download a single SVG
async function downloadSVG(url, code) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const svgData = await response.text();
        const outputFilePath = path.join(outputDir, `${code}.svg`);
        fs.writeFileSync(outputFilePath, svgData, 'utf8');
        console.log(`Downloaded and saved: ${outputFilePath}`);
    } catch (error) {
        console.error(`Error downloading ${url}:`, error);
    }
}

// Process each line in the CSV
(async () => {
    for (const line of lines) {
        const [url, code] = line.split(',');
        if (url && code) {
            await downloadSVG(url.trim(), code.trim());
        } else {
            console.warn(`Invalid line format: ${line}`);
        }
    }
})();