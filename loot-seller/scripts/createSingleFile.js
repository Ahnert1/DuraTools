const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const { glob } = require('glob');

// Configuration
const BUILD_DIR = path.join(__dirname, '../build');
const IMAGES_DIR = path.join(__dirname, '../public/images/items');
const OUTPUT_FILE = path.join(__dirname, '../dist/index.html');

// Convert image to base64
async function imageToBase64(imagePath) {
  const imageBuffer = await readFile(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).slice(1);
  return `data:image/${ext};base64,${base64}`;
}

// Process all images in the items directory
async function processImages() {
  const images = {};
  const files = await readdir(IMAGES_DIR);

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const stats = await stat(filePath);

    if (stats.isFile()) {
      const base64 = await imageToBase64(filePath);
      images[`/images/items/${file}`] = base64;
    }
  }

  return images;
}

// Replace image URLs with base64 data in the main JS file
async function replaceImageUrls(jsContent, imageMap) {
  let content = jsContent;

  // Replace all image URLs with their base64 equivalents
  for (const [url, base64] of Object.entries(imageMap)) {
    content = content.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), base64);
  }

  return content;
}

// Find the main JS and CSS files
async function findMainFiles() {
  const jsDir = path.join(BUILD_DIR, 'static/js');
  const cssDir = path.join(BUILD_DIR, 'static/css');
  const jsFiles = fs.readdirSync(jsDir).filter(f => /^main\..*\.js$/.test(f));
  const cssFiles = fs.readdirSync(cssDir).filter(f => /^main\..*\.css$/.test(f));

  if (jsFiles.length === 0 || cssFiles.length === 0) {
    throw new Error('Could not find main JS or CSS files');
  }

  return {
    js: path.join(jsDir, jsFiles[0]),
    css: path.join(cssDir, cssFiles[0])
  };
}

// Create the single HTML file
async function createSingleFile() {
  try {
    console.log('Processing images...');
    const imageMap = await processImages();

    console.log('Reading build files...');
    const htmlContent = await readFile(path.join(BUILD_DIR, 'index.html'), 'utf8');
    const mainFiles = await findMainFiles();
    const jsContent = await readFile(mainFiles.js, 'utf8');
    const cssContent = await readFile(mainFiles.css, 'utf8');

    console.log('Replacing image URLs with base64 data...');
    const processedJs = await replaceImageUrls(jsContent, imageMap);

    console.log('Creating single HTML file...');

    // Create a new HTML content with inlined CSS and JS
    const singleHtml = htmlContent
      // Remove the script and link tags
      .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '')
      .replace(/<link[^>]*href="[^"]*"[^>]*>/g, '')
      // Add the inlined CSS and JS
      .replace('</head>', `<style>${cssContent}</style></head>`)
      .replace('</body>', `<script>${processedJs}</script></body>`);

    // Create dist directory if it doesn't exist
    const distDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    await writeFile(OUTPUT_FILE, singleHtml);
    console.log(`Single HTML file created at: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error creating single file:', error);
    process.exit(1);
  }
}

// Run the script
createSingleFile(); 