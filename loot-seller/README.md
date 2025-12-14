# Dura Tools

A React application for searching and managing loot items from the Dura game wiki.

## Features

- **Raid Analyzer** Copy and paste in-game raid log here to view all information regarding current raids for the day
- **Comprehensive item database** sourced from [Dura Wiki - Quick Loot List](https://durawiki.miraheze.org/wiki/Quick_Loot_List)
- **Item categories** Weapons, Armor & Shields, Jewelry & Magic Items, Tools & Utilities, and Miscellaneous
- **Category filtering** to easily find the type of items you're looking for
- **Fuzzy search** for item names (allowing typos when searching)
- **Quantity input** to track multiple items
- **Items grouped by NPC vendor** they can be sold to
- **Summary statistics** showing total items, gold value, and NPCs to visit
- **Per-NPC tables** with calculated values and totals
- **Item images** displayed for all items

## Manual Installation

1. Make sure you have Node.js installed
2. Clone the repository
3. Navigate to `loot-seller` directory
4. Install dependencies:

```
npm install
```

## Running the Application

Start the development server:

```
npm start
```

## Updating a raid
Update or add a missing raid in `raidCorrections.js` 
Then run the script to update raids
```
npm run correct-raids
```

## Before pushing Changes
Run this command to build project into a single .html file so it can be hosted on github (for free!)
```
npm run build:single
```
