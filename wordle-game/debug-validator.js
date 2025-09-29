import { WordValidator } from './src/js/WordValidator.js';

const validator = new WordValidator();

console.log('Testing addCustomWord:');
const result = validator.addCustomWord('CUSTOM');
console.log('Result:', result);
console.log('Has CUSTOM:', validator.validWords.has('CUSTOM'));

console.log('\nTesting reset:');
validator.addCustomWord('TEMP');
validator.removeWord('WORLD');
console.log('Before reset - size:', validator.validWords.size);
console.log('Has WORLD before reset:', validator.validWords.has('WORLD'));
console.log('Has TEMP before reset:', validator.validWords.has('TEMP'));

validator.reset();
console.log('After reset - size:', validator.validWords.size);
console.log('Has WORLD after reset:', validator.validWords.has('WORLD'));
console.log('Has TEMP after reset:', validator.validWords.has('TEMP'));

console.log('\nTesting importWords:');
const newWords = ['TEST1', 'TEST2', 'TEST3'];
const importResult = validator.importWords(newWords);
console.log('Import result:', importResult);
console.log('Final size:', validator.validWords.size);
console.log('Has TEST1:', validator.validWords.has('TEST1'));
console.log('Has HELLO:', validator.validWords.has('HELLO'));