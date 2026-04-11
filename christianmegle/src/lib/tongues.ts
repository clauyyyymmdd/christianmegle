/**
 * Glossolalia scrambler — replaces alphabetic characters with random
 * characters from ancient scripts while preserving word boundaries
 * and punctuation. The result looks like real divine language.
 */

const POOLS = {
  hebrew:   'אבגדהוזחטיכלמנסעפצקרשת',
  aramaic:  'ܐܒܓܕܗܘܙܚܛܝܟܠܡܢܣܥܦܨܩܪܫܬ',
  greek:    'αβγδεζηθικλμνξοπρστυφχψω',
  coptic:   'ⲁⲃⲅⲇⲉⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱ',
  geez:     'ሀለሐመሠረሰቀበተኀነአከወዐዘየደገ',
  runic:    'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ',
};

const ALL_CHARS = Object.values(POOLS).join('');

const PRESERVE = /[\s.,!?;:'"()\-–—…\d]/;

export function scrambleToTongues(text: string): string {
  return text
    .split('')
    .map((ch) => {
      if (PRESERVE.test(ch)) return ch;
      return ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
    })
    .join('');
}
