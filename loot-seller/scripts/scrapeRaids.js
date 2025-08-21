const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const { raidOverrides, customRaids } = require('../raidCorrections');
// Add new Map to store mob URLs
const mobUrlMap = new Map();

// Interface for Raid data
/**
 * @typedef {Object} Raid
 * @property {string} href - The URL of the raid page
 * @property {string} name - The name of the raid
 * @property {string} firstMessage - First message of the raid (optional if boss raid)
 * @property {string} secondMessage - Second message of the raid (optional)
 * @property {string} thirdMessage - Third message of the raid (optional)
 * @property {string} bossMessage - Boss message of the raid (optional)
 * @property {string} location - Location of the raid
 * @property {string[]} mobs - List of mobs in the raid
 * @property {string[]} bosses - List of bosses in the raid
 * @property {string[]} floors - List of floors where the raid occurs
 * @property {string} timeToSpawn - Time to spawn information
 */

/**
 * Extracts property value from the raid page HTML
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} propertyName - Name of the property to extract
 * @returns {string|string[]} The extracted property value
 */
function extractPropertyValue($, propertyName) {
    // Find the property container
    const propertyContainer = $('div.oKdM2c.ZZyype.Kzv0Me').filter((_, el) => {
        const text = $(el).text().trim().toLowerCase();
        return text.includes(propertyName.toLowerCase());
    });

    if (propertyContainer.length === 0) {
        if (propertyName === 'mobs' || propertyName === 'floor') return [];
        return '';
    }

    // Find the value container
    const valueContainer = propertyContainer.next('div.oKdM2c.ZZyype');
    if (valueContainer.length === 0) {
        if (propertyName === 'mobs' || propertyName === 'floor') return [];
        return '';
    }

    // Special handling for mobs array
    if (propertyName === 'mobs') {
        // Get all mob names and URLs from links
        const mobs = valueContainer
            .find('a.XqQF9c')
            .map((_, el) => {
                const mobName = $(el).find('span.C9DxTc.aw5Odc').text().trim();
                const href = $(el).attr('href');

                // Store mob URL in the map if it's a valid mob name
                if (mobName && mobName !== '-' && href) {
                    mobUrlMap.set(mobName, href);
                }

                return mobName;
            })
            .get()
            .filter(Boolean)
            .filter(name => name && name !== '-');

        // If no mobs found in links, try the old method as fallback
        if (mobs.length === 0) {
            const value = valueContainer.find('p').text().trim();
            return value
                .split(/[,/]/)
                .map(mob => mob.trim())
                .filter(Boolean)
                .map(mob => mob.replace(/\s+/g, ' '));
        }

        return mobs;
    }

    // Special handling for floor array
    if (propertyName === 'floor') {
        // Get all span elements within the value container
        const spans = valueContainer.find('p.zfr3Q.CDt4Ke span.C9DxTc');
        const floors = [];

        // Process spans in pairs to handle split signs
        for (let i = 0; i < spans.length; i++) {
            const currentText = $(spans[i]).text().trim();

            // Skip empty spans or <br> tags and the word "or"
            if (!currentText || currentText === '<br>' || currentText === 'or') continue;

            // If current span is just a sign and there's a next span
            if ((currentText === '-' || currentText === '+') && i + 1 < spans.length) {
                const nextText = $(spans[i + 1]).text().trim();
                // If next span is a number, combine them
                if (/^\d+$/.test(nextText)) {
                    floors.push(currentText + nextText);
                    i++; // Skip the next span since we've used it
                    continue;
                }
            }

            floors.push(currentText);
        }

        return floors;
    }

    // For other properties, just get the text content
    return valueContainer.find('p').text().trim();
}

/**
 * Extracts time to spawn from the raid page HTML
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string} The extracted time to spawn
 */
function extractTimeToSpawn($) {
    // Find the Time to Spawn section
    const timeSection = $('h3.zfr3Q.OmQG5e.CDt4Ke').filter((_, el) => {
        return $(el).text().trim() === 'Time to Spawn';
    });

    if (timeSection.length === 0) return '';

    // Get the value from the next div's span
    const valueContainer = timeSection.closest('div.oKdM2c.ZZyype.Kzv0Me').next('div.oKdM2c.ZZyype');
    const timeValue = valueContainer.find('p.zfr3Q.CDt4Ke span.C9DxTc').text().trim();

    return timeValue || '';
}

/**
 * Reads existing raid data from TypeScript file and converts to Map
 * @returns {Map<string, Raid>} Map of href to Raid object
 */
function readExistingRaidsFromFile() {
    const inputPath = path.join(__dirname, '../src/data/raidData.ts');
    const content = fs.readFileSync(inputPath, 'utf8');
    const match = content.match(/export const raidData: Raid\[] = (\[[\s\S]*\]);/);
    if (!match) {
        throw new Error('Unable to parse raidData.ts: raidData array not found');
    }
    const jsonArrayText = match[1];
    /** @type {any[]} */
    const raidArray = JSON.parse(jsonArrayText);
    const raids = new Map();
    for (const item of raidArray) {
        const { href, ...rest } = item;
        if (!href) continue;
        raids.set(href, rest);
    }
    return raids;
}

/**
 * Scrapes individual raid page data
 * @param {string} href - The URL of the raid page
 * @returns {Promise<Partial<Raid>>} Additional raid data
 */
async function scrapeRaidPage(href) {
    try {
        const fullUrl = `https://sites.google.com${href}`;
        const response = await axios.get(fullUrl);
        const $ = cheerio.load(response.data);

        // Extract raid name
        const name = $('h1.zfr3Q.duRjpb.CDt4Ke span.C9DxTc').text().trim();

        // Find the Boss section container
        const bossSection = $('h3.zfr3Q.OmQG5e.CDt4Ke').filter((_, el) => {
            return $(el).text().trim() === 'Boss';
        });

        // Get the boss name from the container if it exists
        let bosses = [];

        if (bossSection.length > 0) {
            const valueContainer = bossSection.closest('div.oKdM2c.ZZyype.Kzv0Me').next('div.oKdM2c.ZZyype');
            bosses = valueContainer.find('a.XqQF9c span.C9DxTc.aw5Odc')
                .map((_, el) => $(el).text().trim())
                .get()
                .filter(name => name && name !== '-' && name.toLowerCase() !== 'or');
        }

        // Extract other properties
        const location = extractPropertyValue($, 'location');
        let mobs = [];

        mobs = extractPropertyValue($, 'mobs');

        const floors = extractPropertyValue($, 'floor');
        const timeToSpawn = extractTimeToSpawn($);

        return {
            name,
            location,
            mobs,
            bosses,
            floors,
            timeToSpawn,
        };
    } catch (error) {
        console.error(`Error scraping raid page ${href}:`, error);
        return {
            name: '',
            location: '',
            mobs: [],
            floor: [],
            timeToSpawn: '',
        };
    }
}

/**
 * Scrapes raid data from the main raids page
 * @param {number} [limit] - Optional limit for number of raids to scrape
 * @returns {Promise<Map<string, Raid>>} Map of href to Raid object
 */
async function scrapeRaids(limit) {
    try {
        const response = await axios.get('https://sites.google.com/view/durawiki/raids?authuser=0');
        const $ = cheerio.load(response.data);

        // Map to store href -> messages mapping
        const hrefToMessages = new Map();

        // Find all raid message links
        $('a.XqQF9c').each((_, element) => {
            const href = $(element).attr('href');
            const message = $(element).find('span.C9DxTc').text().trim();

            // Skip if no href or message, or if it's the dura-online.com link
            if (!href || !message || href === 'https://dura-online.com') return;

            if (!hrefToMessages.has(href)) {
                hrefToMessages.set(href, []);
            }
            hrefToMessages.get(href).push(message);
        });

        // Convert to Raid objects and scrape additional data
        const raids = new Map();
        let count = 0;
        for (const [href, messages] of hrefToMessages) {
            if (limit && count >= limit) break;

            console.log(`Scraping additional data for raid: ${href}`);
            const additionalData = await scrapeRaidPage(href);

            const raid = {
                href,
                firstMessage: additionalData.bosses.length > 0 ? '' : (messages[0] || ''),
                secondMessage: additionalData.bosses.length > 0 ? '' : (messages[1] || ''),
                thirdMessage: additionalData.bosses.length > 0 ? '' : (messages[2] || ''),
                bossMessage: additionalData.bosses.length > 0 ? (messages[0] || '') : '',
                ...additionalData
            };
            raids.set(href, raid);
            count++;
        }

        return raids;
    } catch (error) {
        console.error('Error scraping raids:', error);
        throw error;
    }
}

// raidOverrides and customRaids are imported from ../raidCorrections

/**
 * Applies manual overrides and adds custom raids to the raid data
 * @param {Map<string, Raid>} raids - Map of href to Raid object
 * @returns {Map<string, Raid>} Updated raid data
 */
function applyManualAdjustments(raids) {
    // Apply overrides
    for (const [href, overrides] of Object.entries(raidOverrides)) {
        if (raids.has(href)) {
            const raid = raids.get(href);
            raids.set(href, { ...raid, ...overrides });
        }
    }

    // Add custom raids
    for (const customRaid of customRaids) {
        raids.set(customRaid.href, customRaid);
    }

    return raids;
}

/**
 * Saves raid data to a TypeScript file
 * @param {Map<string, Raid>} raids - Map of href to Raid object
 */
function saveRaidsToFile(raids, options) {
    // Apply manual adjustments before saving unless explicitly skipped
    const shouldSkipAdjustments = options && options.skipApplyAdjustments === true;
    if (!shouldSkipAdjustments) {
        raids = applyManualAdjustments(raids);
    }

    const outputPath = path.join(__dirname, '../src/data/raidData.ts');

    // Convert Map to array of objects for easier TypeScript typing
    const raidArray = Array.from(raids.entries()).map(([href, raid]) => ({
        href,
        ...raid
    }));

    const fileContent = `// This file is auto-generated. Do not edit manually.
// Generated on: ${new Date().toISOString()}

export interface Raid {
  href: string;
  name: string;
  firstMessage: string;
  secondMessage: string;
  thirdMessage: string;
  bossMessage: string;
  location: string;
  mobs: string[];
  bosses: string[];
  floors: string[];
  timeToSpawn: string;
}

export const raidData: Raid[] = ${JSON.stringify(raidArray, null, 2).replace(/\u00A0/g, ' ')};
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Raid data saved to ${outputPath}`);
}

/**
 * Saves mob URL data to a JavaScript file
 */
function saveMobUrlsToFile() {
    const outputPath = path.join(__dirname, 'mobUrlMap.js');

    // Convert Map to array of objects
    const mobUrlArray = Array.from(mobUrlMap.entries()).map(([mob, href]) => ({
        mob,
        href
    }));

    const fileContent = `// This file is auto-generated. Do not edit manually.
// Generated on: ${new Date().toISOString()}

module.exports = {
    mobUrls: ${JSON.stringify(mobUrlArray, null, 2)}
};
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Mob URL data saved to ${outputPath}`);
}

/**
 * Main function to run the scraper
 */
async function main() {
    try {
        // Flags
        const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
        const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
        const correctionsOnly = process.argv.includes('--corrections-only') || process.argv.includes('--apply-corrections');

        if (correctionsOnly) {
            console.log('Applying raid corrections only (no scraping)...');
            const raids = readExistingRaidsFromFile();
            const adjusted = applyManualAdjustments(raids);
            saveRaidsToFile(adjusted, { skipApplyAdjustments: true });
            console.log('Corrections applied and raid data updated.');
            return;
        }

        console.log(limit ? `Scraping first ${limit} raids...` : 'Scraping all raids...');
        const raids = await scrapeRaids(limit);
        saveRaidsToFile(raids);
        saveMobUrlsToFile();
        console.log('Scraping completed successfully!');
    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

main();