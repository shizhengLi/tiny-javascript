import { WordleGame } from './src/js/WordleGame.js';

const game = new WordleGame(['WORLD', 'HELLO']);
game.targetWord = 'HELLO';

console.log('目标单词:', game.targetWord);

// 测试 WORLD 对 HELLO
const guess1 = 'WORLD';
const result1 = game.evaluateGuess(guess1);
console.log(`猜测 "${guess1}" 对 "${game.targetWord}":`, result1);
console.log('预期: ["absent","absent","correct","absent","correct"]');

// 测试 LOHEL 对 HELLO
const guess2 = 'LOHEL';
const result2 = game.evaluateGuess(guess2);
console.log(`猜测 "${guess2}" 对 "${game.targetWord}":`, result2);
console.log('预期: ["present","present","correct","correct","present"]');

// 手动分析 WORLD 对 HELLO
console.log('\n手动分析 WORLD 对 HELLO:');
console.log('W vs H - absent');
console.log('O vs E - absent');
console.log('R vs L - absent');
console.log('L vs L - correct');
console.log('D vs O - absent');
console.log('应该是: ["absent","absent","absent","correct","absent"]');

// 手动分析 LOHEL 对 HELLO
console.log('\n手动分析 LOHEL 对 HELLO:');
console.log('L vs H - present (L在HELLO中存在)');
console.log('O vs E - present (O在HELLO中存在)');
console.log('H vs L - present (H在HELLO中存在)');
console.log('E vs L - present (E在HELLO中存在)');
console.log('L vs O - present (L在HELLO中存在)');
console.log('应该是: ["present","present","present","present","present"]');