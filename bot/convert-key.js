import bs58 from 'bs58';

// Paste your private key array here (the numbers inside the brackets)
const privateKeyArray = [
  // PASTE YOUR ARRAY HERE
  // Example: 123, 45, 67, 89, ...
];

// Convert to base58
const base58Key = bs58.encode(Buffer.from(privateKeyArray));
console.log('Your base58 private key:');
console.log(base58Key);
