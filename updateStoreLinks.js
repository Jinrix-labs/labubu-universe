// updateStoreLinks.js
// Run this to add PopMart store links to existing Firestore documents

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAgEdyqSoIEJxhV1ywCsl50OvVl7XvURGI",
    authDomain: "labubu-app-f42ca.firebaseapp.com",
    projectId: "labubu-app-f42ca",
    storageBucket: "labubu-app-f42ca.firebasestorage.app",
    messagingSenderId: "9943020327",
    appId: "1:9943020327:web:753af08ec118f512d3ef02",
    measurementId: "G-6PVLB0C865"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateStoreLinks() {
    console.log('Loading store links from JSON...');

    // Read the JSON file
    const jsonData = JSON.parse(readFileSync('./labubuLinks.json', 'utf8'));
    const figures = jsonData.figures;

    console.log(`Total figures to update: ${figures.length}`);
    console.log('Starting updates...\n');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const figure of figures) {
        try {
            const docId = figure.id.toString(); // Convert ID to string

            // Create storeLinks object
            const storeLinks = {
                popmart: figure.store_link || null,
                amazon: null, // Add later
                ebay: null    // Add later
            };

            // Update the Firestore document
            await updateDoc(doc(db, 'labubus', docId), {
                storeLinks: storeLinks,
                updatedAt: new Date().toISOString()
            });

            successCount++;

            if (figure.store_link) {
                console.log(`✓ Updated [${successCount}/${figures.length}]: ${figure.name} - Link added`);
            } else {
                console.log(`⊘ Updated [${successCount}/${figures.length}]: ${figure.name} - No link (null)`);
                skippedCount++;
            }

        } catch (error) {
            errorCount++;
            console.error(`✗ Error updating ${figure.name}:`, error.message);
        }
    }

    console.log('\n=== Update Complete ===');
    console.log(`✓ Success: ${successCount}`);
    console.log(`⊘ No links: ${skippedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log('\nCheck Firebase Console to verify: https://console.firebase.google.com');

    process.exit(0);
}

// Run the update
updateStoreLinks().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});