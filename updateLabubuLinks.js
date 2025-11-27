// updateLabubuLinks.js
// Extract store links from updateLabubuData.js and update labubuLinks.json

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the updateLabubuData.js file to extract the newData array
const updateScript = readFileSync(join(__dirname, 'updateLabubuData.js'), 'utf8');

// Extract the newData array using regex
const newDataMatch = updateScript.match(/const newData = \[([\s\S]*?)\];/);
if (!newDataMatch) {
  console.error('Could not find newData array in updateLabubuData.js');
  process.exit(1);
}

// Parse the JSON array (it's already valid JSON)
const newDataString = '[' + newDataMatch[1] + ']';
// Clean up any trailing commas
const cleanedString = newDataString.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
const newData = JSON.parse(cleanedString);

console.log(`Found ${newData.length} items with store links`);

// Read existing labubuLinks.json to preserve structure
const existingLinks = JSON.parse(readFileSync(join(__dirname, 'labubuLinks.json'), 'utf8'));

// Update the figures array with new store links
const updatedFigures = existingLinks.figures.map(figure => {
  const newItem = newData.find(item => item.id === figure.id);
  if (newItem && newItem.store_link) {
    return {
      ...figure,
      store_link: newItem.store_link,
      // Also update other fields if they changed
      release_date: newItem.release_date || figure.release_date,
      estimated_value_usd: newItem.estimated_value_usd || figure.estimated_value_usd,
      description: newItem.description || figure.description
    };
  }
  return figure;
});

// Create updated JSON
const updatedLinks = {
  ...existingLinks,
  metadata: {
    ...existingLinks.metadata,
    last_updated: new Date().toISOString().split('T')[0],
    description: "Comprehensive Labubu dataset with updated store_link fields from latest JSON data"
  },
  figures: updatedFigures
};

// Write updated file
writeFileSync(join(__dirname, 'labubuLinks.json'), JSON.stringify(updatedLinks, null, 4), 'utf8');

console.log(`✓ Updated labubuLinks.json with ${newData.length} store links`);
console.log(`✓ Preserved existing structure`);
console.log(`\nNext step: Run 'node updateStoreLinks.js' to upload store links to Firestore`);

