/**
 * Latin / liturgical language map for Exorcism Mode.
 *
 * When exorcism is active, all visible UI text swaps to Latin.
 * Only session-visible strings are mapped — not the full app.
 */

const LATIN_MAP: Record<string, string> = {
  // Chat panel
  'CONFESSION CHAT': 'CONFESSIO COLLOQVIVM',
  'Say something...': 'Dic aliquid...',
  'Session ended.': 'Sessio finita est.',
  'Waiting for connection...': 'Expectans connexionem...',
  'Type a message...': 'Scribe nuntium...',
  'Waiting...': 'Expectans...',
  'Send': 'Mitte',
  'Priest': 'Sacerdos',
  'Stranger': 'Advena',
  'is typing...': 'scribit...',
  'Penitent': 'Paenitens',

  // Toolbar sections
  'Scripture': 'Scriptura Sacra',
  'Atmosphere': 'Atmosphaera',
  'Discipline': 'Disciplina',
  'Send Verse': 'Mitte Versum',
  'Stained Glass': 'Vitrum Pictum',
  'Incense': 'Thus',
  'Candlelight': 'Lumen Candelae',
  'Holy Water': 'Aqua Benedicta',
  'Ring Bells': 'Pulsa Campanas',
  'Take Eucharist': 'Sume Eucharistiam',
  'Impose Silence': 'Impone Silentium',
  'Lift Silence': 'Tolle Silentium',
  'Excommunicate': 'Excommunicatio',
  'Begin Exorcism': 'Incipe Exorcismum',
  'End Exorcism': 'Finis Exorcismi',
  'Speak in Tongues': 'Loqui Linguis',

  // Effects overlay
  'Silence has been imposed': 'Silentium impositum est',
  'Excommunicated': 'Excommunicatus',
  'Your Penance': 'Tua Paenitentia',

  // Video panel
  'End Confession': 'Finis Confessionis',
  'Switch Partner': 'Muta Socium',
};

/**
 * Returns the Latin version of `text` when exorcism is active,
 * or the original text when it is not.
 */
export function exorcismText(text: string, active: boolean): string {
  if (!active) return text;
  return LATIN_MAP[text] ?? text;
}

/**
 * Floating ancient script phrases that drift across the screen
 * during exorcism mode — prayers filling the air.
 */
export const FLOATING_PHRASES = [
  // Koine Greek
  'Κύριε ἐλέησον',
  'Χριστέ ἐλέησον',
  'ἐν ὀνόματι τοῦ Πατρός',
  'Ἅγιος ὁ Θεός',
  // Aramaic
  'מרן אתא',
  'אבא קדישא',
  // Hebrew
  'קדוש קדוש קדוש',
  'אדוני צבאות',
  'ברוך הבא בשם',
  // Coptic
  'Ⲡϭⲟⲓⲥ ⲛⲁⲓ ⲛⲁⲛ',
  'Ⲫⲛⲟⲩϯ ⲛⲁⲓ ⲛⲁⲛ',
  // Ge'ez
  'ቅዱስ ቅዱስ ቅዱስ',
  'እግዚአብሔር',
  // Latin
  'Vade retro satana',
  'In nomine Patris',
  'Exorcizamus te',
  'Libera nos a malo',
  'Agnus Dei qui tollis',
];
