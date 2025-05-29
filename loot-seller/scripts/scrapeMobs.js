const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { mobUrls } = require('./mobUrlMap');

const BASE_URL = 'https://sites.google.com';

/**
 * @typedef {Object} MobData
 * @property {string} name - The name of the mob
 * @property {number} regularExp - Regular XP value
 * @property {number} partyExp - Party XP value
 * @property {number} eliteExp - Elite XP value
 * @property {number} legendaryExp - Legendary XP value
 * @property {number} regularHp - Regular HP value
 * @property {number} partyHp - Party HP value
 * @property {number} eliteHp - Elite HP value
 * @property {number} legendaryHp - Legendary HP value
 * @property {number} heroismLvl - Heroism level
 * @property {number} gloryLvl - Glory level
 * @property {number} overExperiencedLvl - Over Experienced level
 * @property {string[]} elementWeaknesses - Array of element weaknesses
 * @property {string[]} notableLoot - Array of notable loot items
 * @property {string} imageBase64 - Base64 encoded image of the mob
 */

/**
 * Downloads an image and converts it to base64
 * @param {string} imageUrl - The URL of the image to download
 * @returns {Promise<string>} The base64 encoded image
 */
async function getImageBase64(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        console.error(`Error downloading image from ${imageUrl}:`, error);
        return '';
    }
}

/**
 * Extracts a number from text, handling various formats
 * @param {string} text - The text to extract number from
 * @returns {number} The extracted number
 */
function extractNumber(text) {
    if (!text) return 0;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

/**
 * Extracts level from text containing level information
 * @param {string} text - The text containing level information
 * @returns {number} The extracted level
 */
function extractLevel(text) {
    if (!text) return 0;
    const match = text.match(/Level (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Extracts values from a section's paragraphs
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} sectionTitle - The title of the section to find
 * @returns {string[]} Array of values from the section
 */
function extractSectionValues($, sectionTitle) {
    // Find the section header
    const section = $('p.zfr3Q.CDt4Ke span.C9DxTc').filter((_, el) => {
        const text = $(el).text().trim();
        return text === sectionTitle;
    });

    if (section.length === 0) {
        console.log(`Section "${sectionTitle}" not found`);
        return [];
    }

    // Get the parent paragraph element
    const sectionParagraph = section.closest('p');
    const values = [];
    let currentValue = '';

    // Find all spans in the paragraph
    sectionParagraph.find('span.C9DxTc').each((_, el) => {
        const text = $(el).text().trim();

        // If we hit a line break, save the current value and reset
        if (text === '') {
            if (currentValue) {
                values.push(currentValue);
                currentValue = '';
            }
            return;
        }

        // If we hit a section header or label, reset the current value
        if (text === sectionTitle || ['Regular', 'Party', 'Elite', 'Legendary'].includes(text)) {
            if (currentValue) {
                values.push(currentValue);
                currentValue = '';
            }
            return;
        }

        // If we hit a dash, reset the current value
        if (text === '-') {
            if (currentValue) {
                values.push(currentValue);
                currentValue = '';
            }
            return;
        }

        // If we hit a number, add it to the current value
        if (/^\d+$/.test(text)) {
            currentValue += text;
        }
    });

    // Don't forget to add the last value if there is one
    if (currentValue) {
        values.push(currentValue);
    }

    // Filter out any empty values and return
    return values.filter(v => v !== '');
}

/**
 * Scrapes individual mob page data
 * @param {string} href - The URL of the mob page
 * @param {string} mobName - The name of the mob
 * @returns {Promise<MobData>} The scraped mob data
 */
async function scrapeMobPage(href, mobName) {
    try {
        const fullUrl = `${BASE_URL}${href}`;
        console.log(`Scraping ${mobName} from ${fullUrl}`);
        const response = await axios.get(fullUrl);
        const $ = cheerio.load(response.data);

        // Extract image URL
        const imageUrl = $('img.CENy8b').attr('src');
        const imageBase64 = imageUrl ? await getImageBase64(imageUrl) : '';

        // Extract XP values
        const xpValues = extractSectionValues($, 'XP');
        const [regularExp, partyExp, eliteExp, legendaryExp] = xpValues.map(extractNumber);

        // Extract HP values
        const hpValues = extractSectionValues($, 'HP');
        const [regularHp, partyHp, eliteHp, legendaryHp] = hpValues.map(extractNumber);

        // Extract levels
        const heroismSection = $('p.zfr3Q.CDt4Ke').filter((_, el) => {
            return $(el).text().trim().includes('Heroism System');
        });
        const heroismLvl = extractLevel(heroismSection.next('p').text());

        const glorySection = $('p.zfr3Q.CDt4Ke').filter((_, el) => {
            return $(el).text().trim().includes('Glory System');
        });
        const gloryLvl = extractLevel(glorySection.next('p').text());

        const overExpSection = $('p.zfr3Q.CDt4Ke').filter((_, el) => {
            return $(el).text().trim().includes('Over Experienced System');
        });
        const overExperiencedLvl = extractLevel(overExpSection.next('p').text());

        // Extract element weaknesses
        const elementSection = $('p.zfr3Q.CDt4Ke').filter((_, el) => {
            return $(el).text().trim().includes('Elements to hunt with');
        });
        const elementWeaknesses = elementSection.next('p')
            .find('span')
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(text => text && !text.includes('Elements to hunt with') && text != '-');

        // Extract notable loot
        const lootSection = $('p.zfr3Q.CDt4Ke').filter((_, el) => {
            return $(el).text().trim().includes('Notable Loot');
        });

        // Get all p tags that follow the Notable Loot section until we hit another section
        const notableLoot = [];
        let currentElement = lootSection.next('p');

        while (currentElement.length && !currentElement.find('span').text().includes('Elements to hunt with')) {
            const items = currentElement
                .find('a span')
                .map((_, el) => $(el).text().trim())
                .get()
                .filter(text => text && !text.includes('Notable Loot'));

            notableLoot.push(...items);
            currentElement = currentElement.next('p');
        }

        return {
            name: mobName,
            regularExp,
            partyExp,
            eliteExp,
            legendaryExp,
            regularHp,
            partyHp,
            eliteHp,
            legendaryHp,
            heroismLvl,
            gloryLvl,
            overExperiencedLvl,
            elementWeaknesses,
            notableLoot,
            imageBase64
        };
    } catch (error) {
        console.error(`Error scraping mob page ${href}:`, error);
        return {
            name: mobName + ' - ' + "error",
            regularExp: 0,
            partyExp: 0,
            eliteExp: 0,
            legendaryExp: 0,
            regularHp: 0,
            partyHp: 0,
            eliteHp: 0,
            legendaryHp: 0,
            heroismLvl: 0,
            gloryLvl: 0,
            overExperiencedLvl: 0,
            elementWeaknesses: [],
            notableLoot: [],
            imageBase64: ''
        };
    }
}

/**
 * Saves mob data to a TypeScript file
 * @param {MobData[]} mobs - Array of mob data
 */
function saveMobsToFile(mobs) {
    const outputPath = path.join(__dirname, '../src/data/mobData.ts');

    const fileContent = `// This file is auto-generated. Do not edit manually.
// Generated on: ${new Date().toISOString()}

export interface MobData {
  name: string;
  regularExp: number;
  partyExp: number;
  eliteExp: number;
  legendaryExp: number;
  regularHp: number;
  partyHp: number;
  eliteHp: number;
  legendaryHp: number;
  heroismLvl: number;
  gloryLvl: number;
  overExperiencedLvl: number;
  elementWeaknesses: string[];
  notableLoot: string[];
  imageBase64: string;
}

export const mobData: MobData[] = ${JSON.stringify(mobs, null, 2)};
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Mob data saved to ${outputPath}`);
}

/**
 * Main function to run the scraper
 */
async function main() {
    try {
        console.log('Starting mob data scraping...');
        const mobsData = [];

        for (const { mob, href } of mobUrls) {
            const mobData = await scrapeMobPage(href, mob);
            mobsData.push(mobData);

            // Add a small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        saveMobsToFile(mobsData);
        console.log('Scraping completed successfully!');
    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

main(); 