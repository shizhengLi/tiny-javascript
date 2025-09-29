import { WordValidator } from './src/js/WordValidator.js';

const freshValidator = new WordValidator();
console.log('Initial size:', freshValidator.validWords.size);
console.log('Has WORLD initially:', freshValidator.validWords.has('WORLD'));

freshValidator.addCustomWord('ZEBRA');
console.log('After adding ZEBRA - size:', freshValidator.validWords.size);
console.log('Has ZEBRA:', freshValidator.validWords.has('ZEBRA'));

freshValidator.removeWord('WORLD');
console.log('After removing WORLD - size:', freshValidator.validWords.size);
console.log('Has WORLD after removal:', freshValidator.validWords.has('WORLD'));

const initialSize = freshValidator.validWords.size;
console.log('Size before reset:', initialSize);

freshValidator.reset();

console.log('Size after reset:', freshValidator.validWords.size);
console.log('Size changed:', freshValidator.validWords.size !== initialSize);
console.log('Has WORLD after reset:', freshValidator.validWords.has('WORLD'));
console.log('Has ZEBRA after reset:', freshValidator.validWords.has('ZEBRA'));