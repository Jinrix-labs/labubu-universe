// updateLabubuData.js
// Script to merge new JSON data into labubuData.js while preserving image and color fields
// Does NOT include storeLink - that's handled by the Store screen

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read existing labubuData.js to preserve image and color
const existingDataFile = readFileSync(join(__dirname, 'labubuData.js'), 'utf8');

// Extract existing data by parsing the LABUBU_DATA array
const existingItems = [];
const itemRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"][^}]*?image:\s*['"]([^'"]+)['"][^}]*?color:\s*['"]([^'"]+)['"]/gs;
let match;
while ((match = itemRegex.exec(existingDataFile)) !== null) {
  existingItems.push({
    id: match[1],
    name: match[2],
    image: match[3],
    color: match[4]
  });
}

console.log(`Found ${existingItems.length} existing items with image/color data`);

// NEW JSON DATA - User provided in chunks
const newData = [
  {"id":1,"name":"Lychee Berry","series":"Exciting Macaron","rarity":"common","size_cm":7.5,"size_in":3,"description":"Pink macaron flavor","release_date":"2023-10-01","retail_price_usd":12.90,"estimated_value_usd":45,"store_link":"https://www.popmart.com/us/products/the-monsters-exciting-macaron-series"},
  {"id":2,"name":"Sesame Bean","series":"Exciting Macaron","rarity":"common","size_cm":7.5,"size_in":3,"description":"Black sesame flavor","release_date":"2023-10-01","retail_price_usd":12.90,"estimated_value_usd":40,"store_link":"https://www.popmart.com/us/products/the-monsters-exciting-macaron-series"},
  {"id":3,"name":"Green Grape","series":"Exciting Macaron","rarity":"common","size_cm":7.5,"size_in":3,"description":"Green grape flavor","release_date":"2023-10-01","retail_price_usd":12.90,"estimated_value_usd":38,"store_link":"https://www.popmart.com/us/products/the-monsters-exciting-macaron-series"},
  {"id":4,"name":"Soy Milk","series":"Exciting Macaron","rarity":"common","size_cm":7.5,"size_in":3,"description":"Soy milk flavor","release_date":"2023-10-01","retail_price_usd":12.90,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/the-monsters-exciting-macaron-series"},
  {"id":5,"name":"Sea Salt Coconut","series":"Exciting Macaron","rarity":"common","size_cm":7.5,"size_in":3,"description":"Sea salt coconut flavor","release_date":"2023-10-01","retail_price_usd":12.90,"estimated_value_usd":42,"store_link":"https://www.popmart.com/us/products/the-monsters-exciting-macaron-series"},
  {"id":6,"name":"Toffee","series":"Exciting Macaron","rarity":"common","size_cm":7.5,"size_in":3,"description":"Toffee flavor","release_date":"2023-10-01","retail_price_usd":12.90,"estimated_value_usd":38,"store_link":"https://www.popmart.com/us/products/the-monsters-exciting-macaron-series"},
  {"id":7,"name":"Chestnut Cocoa (Secret)","series":"Exciting Macaron","rarity":"secret","size_cm":7.5,"size_in":3,"description":"Chestnut cocoa secret","release_date":"2023-10-01","retail_price_usd":12.90,"estimated_value_usd":120,"store_link":"https://www.popmart.com/us/products/the-monsters-exciting-macaron-series"},
  {"id":8,"name":"Sisi","series":"Have a Seat","rarity":"common","size_cm":8,"size_in":3.2,"description":"Beige calm expression","release_date":"2023-09-15","retail_price_usd":13.50,"estimated_value_usd":35,"store_link":"https://www.popmart.com/us/products/1372/the-monsters-have-a-seat-vinyl-plush-blind-box"},
  {"id":9,"name":"Hehe","series":"Have a Seat","rarity":"common","size_cm":8,"size_in":3.2,"description":"Gray cheeky grin","release_date":"2023-09-15","retail_price_usd":13.50,"estimated_value_usd":32,"store_link":"https://www.popmart.com/us/products/1372/the-monsters-have-a-seat-vinyl-plush-blind-box"},
  {"id":10,"name":"Zizi","series":"Have a Seat","rarity":"common","size_cm":8,"size_in":3.2,"description":"Playful expression","release_date":"2023-09-15","retail_price_usd":13.50,"estimated_value_usd":30,"store_link":"https://www.popmart.com/us/products/1372/the-monsters-have-a-seat-vinyl-plush-blind-box"},
  {"id":11,"name":"Baba","series":"Have a Seat","rarity":"common","size_cm":8,"size_in":3.2,"description":"Relaxed pose","release_date":"2023-09-15","retail_price_usd":13.50,"estimated_value_usd":28,"store_link":"https://www.popmart.com/us/products/1372/the-monsters-have-a-seat-vinyl-plush-blind-box"},
  {"id":12,"name":"Ququ","series":"Have a Seat","rarity":"common","size_cm":8,"size_in":3.2,"description":"Mint green excited eyes","release_date":"2023-09-15","retail_price_usd":13.50,"estimated_value_usd":35,"store_link":"https://www.popmart.com/us/products/1372/the-monsters-have-a-seat-vinyl-plush-blind-box"},
  {"id":13,"name":"Dada","series":"Have a Seat","rarity":"common","size_cm":8,"size_in":3.2,"description":"Pale pink sparkling eyes","release_date":"2023-09-15","retail_price_usd":13.50,"estimated_value_usd":32,"store_link":"https://www.popmart.com/us/products/1372/the-monsters-have-a-seat-vinyl-plush-blind-box"},
  {"id":14,"name":"DuoDuo (Secret)","series":"Have a Seat","rarity":"secret","size_cm":8,"size_in":3.2,"description":"Chocolate brown secret","release_date":"2023-09-15","retail_price_usd":13.50,"estimated_value_usd":150,"store_link":"https://www.popmart.com/us/products/1372/the-monsters-have-a-seat-vinyl-plush-blind-box"},
  {"id":15,"name":"Love","series":"Big into Energy","rarity":"common","size_cm":7.5,"size_in":3,"description":"Red emotion variant","release_date":"2025-04-01","retail_price_usd":14.00,"estimated_value_usd":25,"store_link":"https://www.popmart.com/us/products/2155/the-monsters-big-into-energy-series-vinyl-plush-pendant-blind-box"},
  {"id":16,"name":"Happiness","series":"Big into Energy","rarity":"common","size_cm":7.5,"size_in":3,"description":"Orange emotion variant","release_date":"2025-04-01","retail_price_usd":14.00,"estimated_value_usd":28,"store_link":"https://www.popmart.com/us/products/2155/the-monsters-big-into-energy-series-vinyl-plush-pendant-blind-box"},
  {"id":17,"name":"Loyalty","series":"Big into Energy","rarity":"common","size_cm":7.5,"size_in":3,"description":"Pink/yellow tie-dye","release_date":"2025-04-01","retail_price_usd":14.00,"estimated_value_usd":30,"store_link":"https://www.popmart.com/us/products/2155/the-monsters-big-into-energy-series-vinyl-plush-pendant-blind-box"},
  {"id":18,"name":"Serenity","series":"Big into Energy","rarity":"common","size_cm":7.5,"size_in":3,"description":"Green emotion variant","release_date":"2025-04-01","retail_price_usd":14.00,"estimated_value_usd":26,"store_link":"https://www.popmart.com/us/products/2155/the-monsters-big-into-energy-series-vinyl-plush-pendant-blind-box"},
  {"id":19,"name":"Hope","series":"Big into Energy","rarity":"common","size_cm":7.5,"size_in":3,"description":"Blue emotion variant","release_date":"2025-04-01","retail_price_usd":14.00,"estimated_value_usd":27,"store_link":"https://www.popmart.com/us/products/2155/the-monsters-big-into-energy-series-vinyl-plush-pendant-blind-box"},
  {"id":20,"name":"Luck","series":"Big into Energy","rarity":"common","size_cm":7.5,"size_in":3,"description":"Purple emotion variant","release_date":"2025-04-01","retail_price_usd":14.00,"estimated_value_usd":35,"store_link":"https://www.popmart.com/us/products/2155/the-monsters-big-into-energy-series-vinyl-plush-pendant-blind-box"},
  {"id":21,"name":"Super Energy (Secret)","series":"Big into Energy","rarity":"secret","size_cm":7.5,"size_in":3,"description":"Rainbow glitter secret (Rock the Universe)","release_date":"2025-04-01","retail_price_usd":14.00,"estimated_value_usd":250,"store_link":"https://www.popmart.com/us/products/2155/the-monsters-big-into-energy-series-vinyl-plush-pendant-blind-box"},
  {"id":22,"name":"A - Adventure","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter A pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":23,"name":"B - Belief","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter B pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":11.50,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":24,"name":"C - Courage","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter C pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":25,"name":"D - Dream","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter D pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":26,"name":"E - Excitement","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter E pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":27,"name":"F - Faith","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter F pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":28,"name":"G - Gratitude","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter G pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":29,"name":"H - Hope","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter H pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":30,"name":"I - Inspiration","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter I pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":31,"name":"J - Joy","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter J pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":32,"name":"K - Kindness","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter K pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":33,"name":"L - Love","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter L pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":15,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":34,"name":"M - Magic","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter M pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":35,"name":"N - Nature","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter N pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":36,"name":"O - Optimism","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter O pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":37,"name":"P - Passion","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter P pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":38,"name":"Q - Quiet","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter Q pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":39,"name":"R - Resilience","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter R pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":40,"name":"S - Strength","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter S pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":41,"name":"T - Trust","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter T pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":42,"name":"U - Unity","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter U pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":43,"name":"V - Victory","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter V pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":44,"name":"W - Wisdom","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter W pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":45,"name":"X - Xtra","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter X pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":15,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":46,"name":"Y - Youth","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter Y pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":47,"name":"Z - Zeal","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Letter Z pendant","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":12,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":48,"name":"? - Emm","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Purple question mark","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":20,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":49,"name":"&","series":"Pin for Love","rarity":"common","size_cm":5,"size_in":2,"description":"Ampersand symbol","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":18,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":50,"name":"Heart (Secret)","series":"Pin for Love","rarity":"secret","size_cm":5,"size_in":2,"description":"Heart secret","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":80,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":51,"name":"! (Secret)","series":"Pin for Love","rarity":"secret","size_cm":5,"size_in":2,"description":"Exclamation secret","release_date":"2024-03-01","retail_price_usd":10.50,"estimated_value_usd":90,"store_link":"https://www.popmart.com/us/pop-now/set/330"},
  {"id":52,"name":"Classic Coke","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Classic red can design","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":18,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":53,"name":"Coke Bottle","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Glass bottle shape","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":17,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":54,"name":"Cherry Coke","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Cherry flavor variant","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":19,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":55,"name":"Diet Coke","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Silver can design","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":17,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":56,"name":"Coke Zero","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Black can design","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":18,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":57,"name":"Vanilla Coke","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Cream vanilla variant","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":20,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":58,"name":"Surfboard Coke","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Beach surfboard design","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":22,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":59,"name":"Festive Coke","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Holiday theme","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":18,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":60,"name":"Polar Bear Coke (Secret)","series":"Coca-Cola","rarity":"secret","size_cm":7.5,"size_in":3,"description":"Polar bear secret","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":200,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":61,"name":"Time to Chill Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Sunglasses relaxed pose","release_date":"2024-02-15","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/578/labubu-time-to-chill-vinyl-plush-doll"},
  {"id":62,"name":"Jump for Joy Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Bouncing pose","release_date":"2024-04-10","retail_price_usd":39.99,"estimated_value_usd":45,"store_link":"https://www.popmart.com/us/products/281/the-monsters-jump-for-joy-vinyl-plush-doll"},
  {"id":63,"name":"Dress Be Latte Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Coffee outfit","release_date":"2024-06-20","retail_price_usd":39.99,"estimated_value_usd":48,"store_link":"https://www.popmart.com/us/products/676/the-monsters-dress-be-latte-vinyl-plush-doll"},
  {"id":64,"name":"Flip with Me Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Acrobatic pose","release_date":"2024-08-01","retail_price_usd":39.99,"estimated_value_usd":47,"store_link":"https://www.popmart.com/us/products/1371/the-monsters-flip-with-me-vinyl-plush-doll"},
  {"id":65,"name":"Let's Checkmate Labubu (Big)","series":"Standalone Plush","rarity":"limited","size_cm":30,"size_in":11.8,"description":"Chess king design","release_date":"2024-09-10","retail_price_usd":49.99,"estimated_value_usd":60,"store_link":null},
  {"id":66,"name":"Walk By Fortune Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Lucky cat theme","release_date":"2024-10-01","retail_price_usd":39.99,"estimated_value_usd":55,"store_link":null},
  {"id":67,"name":"Best of Luck Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Fortune theme","release_date":"2024-10-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/890/the-monsters-best-of-luck-vinyl-plush-doll"},
  {"id":68,"name":"Catch Me If You Like Me Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Playful chase","release_date":"2024-07-15","retail_price_usd":39.99,"estimated_value_usd":45,"store_link":"https://www.popmart.com/us/products/922/the-monsters-catch-me-if-you-like-me-series-vinyl-doll-gift-box"},
  {"id":69,"name":"Be Fancy Now Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Glam outfit","release_date":"2024-11-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/1012/labubu-%25C3%2597-pronounce-be-fancy-now-vinyl-plush-doll"},
  {"id":70,"name":"Wings of Fantasy Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Fairy wings","release_date":"2024-12-01","retail_price_usd":39.99,"estimated_value_usd":52,"store_link":"https://www.popmart.com/us/products/1580/labubu-%25C3%2597-pronounce-wings-of-fantasy-vinyl-plush-doll"},
  {"id":71,"name":"Hide and Seek Singapore Labubu","series":"Regional Exclusive","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Singapore exclusive","release_date":"2024-06-01","retail_price_usd":45.00,"estimated_value_usd":80,"store_link":"https://www.popmart.com/sg/products/1149/LABUBU-HIDE-AND-SEEK-IN-SINGAPORE-SERIES-Vinyl-Plush-Doll-Pendant"},
  {"id":72,"name":"Good Lucky Thailand Labubu","series":"Regional Exclusive","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Thailand exclusive","release_date":"2024-06-01","retail_price_usd":45.00,"estimated_value_usd":75,"store_link":null},
  {"id":73,"name":"14th Anniversary Labubu","series":"Anniversary","rarity":"limited","size_cm":30,"size_in":11.8,"description":"Pop Mart 14th anniversary edition","release_date":"2024-12-10","retail_price_usd":59.99,"estimated_value_usd":90,"store_link":"https://www.popmart.com/us/products/1477/matchless-pop-mart-14th-anniversary-series-figures"},
  {"id":74,"name":"Close to Sweet Mokoko (Big)","series":"Mokoko","rarity":"limited","size_cm":30,"size_in":11.8,"description":"Large sweet Mokoko","release_date":"2024-03-15","retail_price_usd":49.99,"estimated_value_usd":60,"store_link":null},
  {"id":75,"name":"Fall into Spring Mokoko (Big)","series":"Mokoko","rarity":"limited","size_cm":30,"size_in":11.8,"description":"Floral Mokoko","release_date":"2024-04-01","retail_price_usd":49.99,"estimated_value_usd":58,"store_link":null},
  {"id":76,"name":"The Blue Diamond Mokoko","series":"Mokoko","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Blue sparkling Mokoko","release_date":"2024-05-10","retail_price_usd":39.99,"estimated_value_usd":70,"store_link":null},
  {"id":77,"name":"I Found You Zimomo","series":"Zimomo","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Hide-and-seek Zimomo","release_date":"2024-06-15","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/878/the-monsters-i-found-you-vinyl-face-doll"},
  {"id":78,"name":"Angel in Clouds Zimomo","series":"Zimomo","rarity":"rare","size_cm":25,"size_in":9.8,"description":"Cloud angel Zimomo","release_date":"2024-06-15","retail_price_usd":39.99,"estimated_value_usd":65,"store_link":"https://www.popmart.com/us/products/878/the-monsters-i-found-you-vinyl-face-doll"},
  {"id":79,"name":"Forest Fairy Tale Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Enchanted forest","release_date":"2024-08-01","retail_price_usd":39.99,"estimated_value_usd":48,"store_link":"https://www.popmart.com/us/products/2934/POP-BEAN-THE-MONSTERS-Forest-Fairy-Tale-Set-LABUBU-Waiting-For-The-Prologue"},
  {"id":80,"name":"Space Adventure Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Astronaut Labubu","release_date":"2024-10-01","retail_price_usd":39.99,"estimated_value_usd":52,"store_link":"https://www.popmart.com/au/products/202/the-monsters-space-adventures-series"},
  {"id":81,"name":"Playing Games Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Gamer Labubu","release_date":"2024-11-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/1500/the-monsters-playing-games-series-scene-sets"},
  {"id":82,"name":"Sakura Blossom Labubu","series":"Regional Exclusive","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Japan cherry blossom","release_date":"2024-03-01","retail_price_usd":45.00,"estimated_value_usd":70,"store_link":null},
  {"id":83,"name":"Lunar New Year Labubu","series":"Holiday","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Red & gold festive","release_date":"2025-01-28","retail_price_usd":45.00,"estimated_value_usd":65,"store_link":null},
  {"id":84,"name":"Mermaid Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Ocean mermaid","release_date":"2024-07-01","retail_price_usd":39.99,"estimated_value_usd":55,"store_link":null},
  {"id":85,"name":"Halloween Pumpkin Labubu","series":"Holiday","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Sitting pumpkin","release_date":"2024-10-15","retail_price_usd":39.99,"estimated_value_usd":60,"store_link":null},
  {"id":86,"name":"Winter Snowflake Labubu","series":"Holiday","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Snowflake design","release_date":"2024-12-01","retail_price_usd":39.99,"estimated_value_usd":55,"store_link":null},
  {"id":87,"name":"Candy Carnival Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Candy theme","release_date":"2024-10-01","retail_price_usd":39.99,"estimated_value_usd":52,"store_link":null},
  {"id":88,"name":"Golden Harvest Labubu","series":"Holiday","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Autumn gold","release_date":"2024-11-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":null},
  {"id":89,"name":"Mega Labubu (40cm)","series":"Mega Edition","rarity":"ultra-rare","size_cm":40,"size_in":15.7,"description":"Oversized exclusive","release_date":"2024-12-20","retail_price_usd":99.99,"estimated_value_usd":180,"store_link":null},
  {"id":90,"name":"Tycoco Boyfriend","series":"Tycoco","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Tycoco with boyfriend outfit","release_date":"2024-07-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/collection/11/the-monsters"},
  {"id":91,"name":"Wacky Mart Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Pop Mart store theme","release_date":"2024-09-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/2771/the-monsters-wacky-mart-series-figures"},
  {"id":92,"name":"Starry Adventure Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Star theme","release_date":"2024-09-15","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":null},
  {"id":93,"name":"Lucky Clover Labubu","series":"Holiday","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Four-leaf clover","release_date":"2024-10-15","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":null},
  {"id":94,"name":"Tropical Paradise Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Island theme","release_date":"2024-07-15","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":null},
  {"id":95,"name":"Moonlit Garden Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Night garden","release_date":"2024-08-15","retail_price_usd":39.99,"estimated_value_usd":48,"store_link":null},
  {"id":96,"name":"Festival Fireworks Labubu","series":"Holiday","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Fireworks theme","release_date":"2024-12-15","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":null},
  {"id":97,"name":"Rainbow Dream Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Rainbow colors","release_date":"2024-09-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":null},
  {"id":98,"name":"Frosty Winter Labubu","series":"Holiday","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Icy blue winter","release_date":"2024-12-01","retail_price_usd":39.99,"estimated_value_usd":55,"store_link":null},
  {"id":99,"name":"Cosmic Explorer Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Space explorer","release_date":"2024-10-15","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":null},
  {"id":100,"name":"Dreamy Cloud Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Fluffy cloud","release_date":"2024-11-15","retail_price_usd":39.99,"estimated_value_usd":48,"store_link":null},
  {"id":101,"name":"Vans Collab Labubu","series":"Collab","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Vans sneaker collab","release_date":"2024-08-20","retail_price_usd":49.99,"estimated_value_usd":120,"store_link":null},
  {"id":102,"name":"Magic of Pumpkin Mokoko","series":"Mokoko","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Halloween pumpkin Mokoko","release_date":"2024-10-01","retail_price_usd":39.99,"estimated_value_usd":65,"store_link":null},
  {"id":103,"name":"Twinkly Fairy Tale Mokoko","series":"Mokoko","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Fairy tale Mokoko","release_date":"2024-12-01","retail_price_usd":39.99,"estimated_value_usd":52,"store_link":null},
  {"id":104,"name":"Fall in Wild Big Plush","series":"Fall in Wild","rarity":"limited","size_cm":30,"size_in":11.8,"description":"Large forest plush","release_date":"2024-05-01","retail_price_usd":49.99,"estimated_value_usd":60,"store_link":"https://www.popmart.com/us/products/1061/the-monsters-fall-in-wild-series-vinyl-plush-doll-pendant"},
  {"id":105,"name":"Fall in Wild Keychain","series":"Fall in Wild","rarity":"limited","size_cm":10,"size_in":3.9,"description":"Mini forest keychain","release_date":"2024-05-01","retail_price_usd":19.99,"estimated_value_usd":25,"store_link":"https://www.popmart.com/us/products/1061/the-monsters-fall-in-wild-series-vinyl-plush-doll-pendant"},
  {"id":106,"name":"Let's Checkmate Hangcard","series":"Standalone Plush","rarity":"limited","size_cm":10,"size_in":3.9,"description":"Chess keychain","release_date":"2024-09-10","retail_price_usd":19.99,"estimated_value_usd":25,"store_link":null},
  {"id":107,"name":"Wings of Fortune Labubu","series":"Standalone Plush","rarity":"limited","size_cm":25,"size_in":9.8,"description":"Golden wings","release_date":"2024-12-01","retail_price_usd":39.99,"estimated_value_usd":50,"store_link":"https://www.popmart.com/us/products/1584/labubu-%25C3%2597-pronounce-wings-of-fortune-vinyl-plush-hanging-card"},
  {"id":108,"name":"Close to Sweet Keychain","series":"Mokoko","rarity":"limited","size_cm":10,"size_in":3.9,"description":"Mini sweet Mokoko","release_date":"2024-03-15","retail_price_usd":19.99,"estimated_value_usd":25,"store_link":null},
  {"id":109,"name":"Fall into Spring Keychain","series":"Mokoko","rarity":"limited","size_cm":10,"size_in":3.9,"description":"Mini floral Mokoko","release_date":"2024-04-01","retail_price_usd":19.99,"estimated_value_usd":24,"store_link":null},
  {"id":110,"name":"Rock the Universe Labubu (30cm)","series":"Standalone Plush","rarity":"limited","size_cm":30,"size_in":11.8,"description":"Cosmic large plush","release_date":"2024-11-15","retail_price_usd":49.99,"estimated_value_usd":65,"store_link":null},
  {"id":111,"name":"Holiday Coke Labubu","series":"Coca-Cola","rarity":"common","size_cm":7.5,"size_in":3,"description":"Festive red & white","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":18,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":112,"name":"Silver Can Labubu","series":"Coca-Cola","rarity":"rare","size_cm":7.5,"size_in":3,"description":"Shiny silver variant","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":35,"store_link":"https://www.popmart.com/us/pop-now/set/171"},
  {"id":113,"name":"Coke Secret Variant","series":"Coca-Cola","rarity":"secret","size_cm":7.5,"size_in":3,"description":"Special secret","release_date":"2024-07-20","retail_price_usd":15.00,"estimated_value_usd":150,"store_link":"https://www.popmart.com/us/pop-now/set/171"}
];

// Function to find existing item by id or name
function findExistingItem(id, name) {
  const idMatch = existingItems.find(item => item.id === id.toString() || item.id === id);
  if (idMatch) return idMatch;
  
  const nameMatch = existingItems.find(item => 
    item.name.toLowerCase() === name.toLowerCase() ||
    item.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(item.name.toLowerCase())
  );
  return nameMatch;
}

// Convert new data format to labubuData.js format
function convertToLabubuFormat(newItem) {
  const existing = findExistingItem(newItem.id, newItem.name);
  
  // Capitalize rarity first letter
  const rarity = (newItem.rarity || 'common').charAt(0).toUpperCase() + (newItem.rarity || 'common').slice(1);
  
  return {
    id: newItem.id.toString(),
    name: newItem.name,
    series: newItem.series,
    releaseDate: newItem.release_date,
    dimensions: `${newItem.size_cm}cm / ${newItem.size_in} inches`,
    image: existing?.image || `https://via.placeholder.com/150/FF69B4/FFFFFF?text=${encodeURIComponent(newItem.name)}`,
    rarity: rarity,
    color: existing?.color || 'Unknown',
    estimatedValue: { 
      min: newItem.estimated_value_usd, 
      max: newItem.estimated_value_usd 
    },
    originalPrice: newItem.retail_price_usd,
    description: newItem.description
    // NOTE: storeLink is NOT included - that's for the Store screen
  };
}

// Convert all items
const convertedData = newData.map(convertToLabubuFormat);

// Generate the new labubuData.js file content
let output = `// Complete Labubu Dataset - All ${convertedData.length} Figures
// Updated with new JSON data structure including description field
// Preserves existing image and color fields
// NOTE: storeLink is handled separately by the Store screen
export const LABUBU_DATA = [\n`;

// Group by series for better organization
const seriesGroups = {};
convertedData.forEach(item => {
  if (!seriesGroups[item.series]) {
    seriesGroups[item.series] = [];
  }
  seriesGroups[item.series].push(item);
});

// Write each series group
Object.keys(seriesGroups).forEach((series, seriesIndex) => {
  const items = seriesGroups[series];
  const seriesCount = items.length;
  const secretCount = items.filter(i => i.rarity === 'Secret').length;
  const commonCount = seriesCount - secretCount;
  
  output += `    // ${series} Series (${seriesCount} figures: ${commonCount} common${secretCount > 0 ? `, ${secretCount} secret` : ''})\n`;
  
  items.forEach((item, itemIndex) => {
    output += `    {\n`;
    output += `        id: '${item.id}',\n`;
    output += `        name: '${item.name.replace(/'/g, "\\'")}',\n`;
    output += `        series: '${item.series.replace(/'/g, "\\'")}',\n`;
    output += `        releaseDate: '${item.releaseDate}',\n`;
    output += `        dimensions: '${item.dimensions}',\n`;
    output += `        image: '${item.image}',\n`;
    output += `        rarity: '${item.rarity}',\n`;
    output += `        color: '${item.color.replace(/'/g, "\\'")}',\n`;
    output += `        estimatedValue: { min: ${item.estimatedValue.min}, max: ${item.estimatedValue.max} },\n`;
    output += `        originalPrice: ${item.originalPrice},\n`;
    if (item.description) {
      output += `        description: '${item.description.replace(/'/g, "\\'")}',\n`;
    }
    output += `    }`;
    
    // Add comma if not last item in entire array
    const isLastSeries = seriesIndex === Object.keys(seriesGroups).length - 1;
    const isLastItem = itemIndex === items.length - 1;
    if (!(isLastSeries && isLastItem)) {
      output += `,`;
    }
    output += `\n`;
  });
  
  if (seriesIndex < Object.keys(seriesGroups).length - 1) {
    output += `\n`;
  }
});

output += `];

// Get unique series for filter pills
export const SERIES_OPTIONS = ['All', ...new Set(LABUBU_DATA.map(l => l.series))];
`;

// Write to file
writeFileSync(join(__dirname, 'labubuData.js'), output, 'utf8');

console.log(`\n✓ Updated labubuData.js with ${convertedData.length} items`);
console.log(`✓ Preserved ${existingItems.length} existing image/color mappings`);
console.log(`✓ Added description field`);
console.log(`✓ Excluded storeLink (handled by Store screen)`);
console.log(`\nNext step: Run 'node uploadToFirebase.js' to upload to Firestore`);
