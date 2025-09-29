import { WordValidator } from './src/js/WordValidator.js';

const validator = new WordValidator();

console.log('Word list size:', validator.validWords.size);
console.log('Has TRULY initially:', validator.validWords.has('TRULY'));

console.log('\nChecking TRULY format:');
const formatResult = validator.validateFormat('TRULY');
console.log('Format result:', formatResult);

console.log('\nAdding TRULY:');
const addResult = validator.addCustomWord('TRULY');
console.log('Add result:', addResult);

console.log('\nFinal has TRULY:', validator.validWords.has('TRULY'));

// Check if TRULY is already in the common words list
console.log('\nCommon words has TRULY:', validator.commonWords.has('TRULY'));

// Let's see some words from the list
console.log('\nSample words containing TR:');
const sampleWords = Array.from(validator.validWords).filter(word => word.includes('TR'));
console.log(sampleWords.slice(0, 10));