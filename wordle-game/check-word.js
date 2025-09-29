import { WordValidator } from './src/js/WordValidator.js';

const validator = new WordValidator();

console.log('Checking if UNIQUE is already in word list:');
console.log('Has UNIQUE:', validator.validWords.has('UNIQUE'));

console.log('\nTrying to add UNIQUE:');
const result = validator.addCustomWord('UNIQUE');
console.log('Result:', result);

console.log('\nTrying to add TRULY:');
const result2 = validator.addCustomWord('TRULY');
console.log('Result:', result2);
console.log('Has TRULY:', validator.validWords.has('TRULY'));

console.log('\nWord list size:', validator.validWords.size);