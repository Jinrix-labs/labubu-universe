// uploadToFirebase.js
// Run this ONCE to upload all Labubu data to Firebase

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Import your Labubu data
import { LABUBU_DATA } from './labubuData.js';

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

async function uploadLabubus() {
    console.log('Starting upload to Firebase...');
    console.log(`Total Labubus to upload: ${LABUBU_DATA.length}`);

    let successCount = 0;
    let errorCount = 0;

    for (const labubu of LABUBU_DATA) {
        try {
            // Upload to Firestore collection 'labubus' with the labubu's id as document ID
            await setDoc(doc(db, 'labubus', labubu.id), {
                ...labubu,
                updatedAt: new Date().toISOString() // Add timestamp
            });

            successCount++;
            console.log(`✓ Uploaded [${successCount}/${LABUBU_DATA.length}]: ${labubu.name}`);
        } catch (error) {
            errorCount++;
            console.error(`✗ Error uploading ${labubu.name}:`, error.message);
        }
    }

    console.log('\n=== Upload Complete ===');
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log('\nCheck Firebase Console to verify: https://console.firebase.google.com');

    process.exit(0);
}

// Run the upload
uploadLabubus().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});