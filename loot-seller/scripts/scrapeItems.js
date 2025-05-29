// Script to scrape item data from Dura Wiki
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const skipImages = args.includes('--skip-images');

// Path to the local HTML file
const LOCAL_HTML_PATH = path.join(__dirname, '../scripts/htmlItemsToScrape.html');

const getItemCategory = (itemName) => {
  const name = itemName.toLowerCase();
  if (
    name.includes('ring') || name.includes('amulet') || name.includes('necklace') ||
    name.includes('bangle') || name.includes('talisman') || name.includes('starlight')
  ) {
    return 'Jewelry & Magic Items';
  }
  if (name.includes("armor") || name.includes("robe") || name.includes("coat") || name.includes("jacket") || name.includes("doublet") || name.includes("scale mail")) {
    return 'Armors';
  }

  if (name.includes("shield") || name.includes("aegis")) {
    return 'Shields';
  }
  if (name.includes("helmet") || name.includes("mask") || name.includes("mystic turban") || name.includes("tiara")) {
    return 'Helmets';
  }
  if (name.includes("legs") || name.includes("marjana's")) {
    return 'Legs';
  }
  if (name.includes("boots") || name.includes("slippers") || name.includes("sandals")) {
    return 'Boots';
  }
  if (
    name.includes('sword') || name.includes('axe') || name.includes('club') ||
    name.includes('hammer') || name.includes('mace') || name.includes('lance') ||
    name.includes('rod') || name.includes('wand') || name.includes('spear') ||
    name.includes('star') || name.includes('knife') || name.includes('scythe') ||
    name.includes('sickle') || name.includes("bow") || name.includes("khopesh") ||
    name.includes("courage") || name.includes("dagger") || name.includes("staff") || name.includes("blade") ||
    name.includes("scimitar") || name.includes("halberd") || name.includes("hatchet") || name.includes("rapier") ||
    name.includes("justice") || name.includes("katana") || name.includes("naginata") || name.includes("sabre") ||
    name.includes("ironwing") || name.includes("crowbar") || name.includes("worker's") || name.includes("wrath")
  ) {
    return 'Weapons';
  }


  if (
    name.includes('rope') || name.includes('rod') || name.includes('shovel') ||
    name.includes('pick') || name.includes('torch') || name.includes('bucket') ||
    name.includes('basket') || name.includes('machete')
  ) {
    return 'Tools & Utilities';
  }
  return 'Miscellaneous';
}

// Function to download an image
const downloadImage = async (url, filepath) => {
  return new Promise((resolve, reject) => {
    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }

    console.log(`Attempting to download: ${url}`);
    console.log(`Saving to: ${filepath}`);

    const protocol = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://durawiki.miraheze.org/'
      }
    };

    const request = protocol.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log(`Following redirect to: ${response.headers.location}`);
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        console.error(`Failed to download image: ${response.statusCode} - ${url}`);
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      // Create the directory if it doesn't exist
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const fileStream = fs.createWriteStream(filepath);

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Successfully saved: ${filepath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        console.error(`Error writing file ${filepath}:`, err);
        fs.unlink(filepath, () => { }); // Delete the file if there's an error
        reject(err);
      });
    });

    request.on('error', (err) => {
      console.error(`Network error downloading ${url}:`, err);
      reject(err);
    });

    // Set a timeout
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
};

// Function to sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')     // Remove special characters including apostrophes
    .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
};

// Read HTML content from the local file
const fetchWikiPage = () => {
  return new Promise((resolve, reject) => {
    try {
      const html = fs.readFileSync(LOCAL_HTML_PATH, 'utf8');
      resolve(html);
    } catch (err) {
      reject(err);
    }
  });
};

// Parse the HTML to extract item data with all NPCs offering highest price
const extractItemData = async (html) => {
  console.log("HTML length:", html.length);
  console.log("Parsing wiki page HTML...");

  const $ = cheerio.load(html);
  const items = [];
  let imageCount = 0;

  const imagesDir = path.join(__dirname, '../public/images/items');
  if (!skipImages) {
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
  }

  // First pass: collect all items
  $('table').each((tableIndex, table) => {
    $(table).find('tr').each((rowIndex, row) => {
      // Skip header rows
      if (rowIndex === 0) return;

      const cells = $(row).find('td');
      if (cells.length === 0) return;

      // Extract item name from first cell
      const nameCell = $(cells[0]);
      let itemName = nameCell.text().trim();
      // Try to get the name from the link title if available
      const nameLink = nameCell.find('a[title]');
      let wikiHref = null;
      if (nameLink.length) {
        itemName = nameLink.attr('title').trim();
        // Get the href from the link
        const href = nameLink.attr('href');
        if (href) {
          wikiHref = href.startsWith('//') ? 'https:' + href : href;
        }
      }
      // Remove "(page does not exist)" from item name
      itemName = itemName.replace(/\s*\(page does not exist\)\s*/, '');

      // Extract image from second cell
      const imageCell = $(cells[1]);
      let imageUrl = null;

      // Look for image in the second cell
      const imgTag = imageCell.find('img');
      if (imgTag.length) {
        imageUrl = imgTag.attr('src');
        if (!skipImages) {
          console.log(`Found image for ${itemName}: ${imageUrl}`);
        }
        imageCount++;
      } else {
        if (!skipImages) console.log(`No image found for ${itemName}`);
      }

      // Extract sell-to cell (last cell)
      const sellToCell = $(cells).last();
      const sellToText = sellToCell.text();

      // Match patterns like: NPC Name (Location) - 12, NPC Name (Location) - 12gp, etc.
      const sellMatches = [...sellToText.matchAll(/([^-\d]+?)\s*-\s*([\d.,]+)/g)];
      if (sellMatches.length === 0) return;

      // Find the highest value and collect NPCs offering that value
      let maxValue = 0;
      let maxNpcs = new Set(); // Use Set to avoid duplicates

      for (const match of sellMatches) {
        // Get the full NPC text including location
        const npcText = match[1].trim();

        // Extract NPC name and location
        const npcMatch = npcText.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
        if (!npcMatch) continue;

        const npcName = npcMatch[1].trim();
        const location = npcMatch[2] ? npcMatch[2].trim() : '';

        // Format NPC name with location if available
        const formattedNpc = location ? `${npcName} (${location})` : npcName;

        const val = parseInt(match[2].replace(/[.,]/g, ''), 10);

        if (val > maxValue) {
          maxValue = val;
          maxNpcs = new Set([formattedNpc]);
        } else if (val === maxValue) {
          maxNpcs.add(formattedNpc);
        }
      }

      // Skip if no valid data found
      if (!itemName || maxValue === 0 || maxNpcs.size === 0) return;

      // Get the original file extension from the URL
      const originalExt = imageUrl ? (path.extname(imageUrl) || '.png') : '.png';
      const imageFilename = `${sanitizeFilename(itemName)}${originalExt}`;
      const imageBase64 = imageUrl ? getImageBase64(imageFilename) : undefined;

      // Add item with cleaned NPC names
      const category = getItemCategory(itemName);
      items.push({
        name: itemName,
        value: maxValue,
        npcNames: Array.from(maxNpcs).filter(npc => npc.length > 0),
        imageBase64,
        category,
        wikiHref,
        _imageData: !skipImages && imageUrl ? {
          url: imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl,
          filename: imageFilename
        } : undefined
      });
    });
  });

  if (!skipImages) {
    console.log(`Found ${imageCount} images to download`);

    // Second pass: download images
    console.log('Downloading images...');
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      if (item._imageData) {
        try {
          await downloadImage(
            item._imageData.url,
            path.join(imagesDir, item._imageData.filename)
          );
          console.log(`Successfully downloaded image for ${item.name}`);
          successCount++;
        } catch (err) {
          item.imageBase64 = undefined;
          failCount++;
          if (!skipImages) console.error(`Failed to download image for ${item.name}:`, err.message);
        }
      }
    }

    console.log(`Image download summary: ${successCount} succeeded, ${failCount} failed`);
  } else {
    console.log('Skipping image downloads as requested');
  }

  // Remove temporary _imageData property
  items.forEach(item => delete item._imageData);

  // Sort alphabetically by name
  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));
  const uniqueItems = [];
  const seenNames = new Set();
  for (const item of sortedItems) {
    const nameKey = item.name.trim().toLowerCase();
    if (!seenNames.has(nameKey)) {
      uniqueItems.push(item);
      seenNames.add(nameKey);
    }
  }
  return uniqueItems;
};

// Generate the TypeScript file with the item data
const generateTypeScriptFile = (items) => {
  let tsContent = `export interface ItemData {
  name: string;
  npcNames: string[]; // Array of NPC names that buy for the highest price
  value: number;
  imageBase64?: string; // Optional base64 for item image
  category?: string;
  wikiHref?: string; // Link to the item's wiki page
}

// Data scraped from Dura Wiki tables
export const lootItems: ItemData[] = [
`;

  for (const item of items) {
    const npcsString = item.npcNames.map(npc => `"${npc}"`).join(', ');
    const imageBase64String = item.imageBase64 ? `, imageBase64: \`${item.imageBase64}\`` : '';
    const wikiHrefString = item.wikiHref ? `, wikiHref: "${item.wikiHref}"` : '';
    tsContent += `  { name: "${item.name}", npcNames: [${npcsString}], value: ${item.value}, category: "${item.category}"${imageBase64String}${wikiHrefString} },\n`;
  }

  tsContent += '];';

  return tsContent;
};

// Helper to get base64 for an image file
const getImageBase64 = (filename) => {
  try {
    const imagesDir = path.join(__dirname, '../public/images/items');
    const filePath = path.join(imagesDir, filename);
    if (!fs.existsSync(filePath)) return undefined;
    const ext = path.extname(filename).slice(1);
    const data = fs.readFileSync(filePath);
    return `data:image/${ext};base64,${data.toString('base64')}`;
  } catch (e) {
    return undefined;
  }
};

// Main function to scrape the data and save to TypeScript file
const main = async () => {
  try {
    console.log('Fetching data from local HTML...');
    const html = await fetchWikiPage();

    console.log('Extracting item data' + (skipImages ? ' (skipping images)' : ' and downloading images') + '...');
    const items = await extractItemData(html);

    if (items.length === 0) {
      console.error('No items found. Check if the page structure has changed.');
      return;
    }

    console.log(`Found ${items.length} items.`);

    // Generate TypeScript content
    const tsContent = generateTypeScriptFile(items);

    // Create the data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write the TypeScript file
    fs.writeFileSync(path.join(dataDir, 'itemDataMultiNpc.ts'), tsContent);
    console.log('TypeScript file generated successfully: src/data/itemDataMultiNpc.ts');

  } catch (error) {
    console.error('Error scraping item data:', error);
  }
};

// Run the script
main(); 