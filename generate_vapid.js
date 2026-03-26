const fs = require('fs');
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
fs.appendFileSync('.env.local', `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}\n`);
fs.appendFileSync('.env.local', `VAPID_PRIVATE_KEY=${keys.privateKey}\n`);
console.log('VAPID keys added to .env.local');
