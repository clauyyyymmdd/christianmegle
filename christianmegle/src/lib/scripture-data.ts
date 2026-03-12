import { ScriptureVerse, SinCategory } from './types';

export const SCRIPTURE_BY_SIN: Record<SinCategory, ScriptureVerse[]> = {
  pride: [
    {
      reference: 'Proverbs 16:18',
      text: 'Pride goes before destruction, a haughty spirit before a fall.',
      category: 'pride',
    },
    {
      reference: 'James 4:6',
      text: 'God opposes the proud but shows favor to the humble.',
      category: 'pride',
    },
    {
      reference: 'Proverbs 11:2',
      text: 'When pride comes, then comes disgrace, but with humility comes wisdom.',
      category: 'pride',
    },
    {
      reference: '1 Peter 5:5',
      text: 'Clothe yourselves, all of you, with humility toward one another, for God opposes the proud but gives grace to the humble.',
      category: 'pride',
    },
    {
      reference: 'Isaiah 2:12',
      text: 'The Lord Almighty has a day in store for all the proud and lofty, for all that is exalted, and they will be humbled.',
      category: 'pride',
    },
  ],

  greed: [
    {
      reference: 'Luke 12:15',
      text: 'Watch out! Be on your guard against all kinds of greed; life does not consist in an abundance of possessions.',
      category: 'greed',
    },
    {
      reference: '1 Timothy 6:10',
      text: 'For the love of money is a root of all kinds of evil.',
      category: 'greed',
    },
    {
      reference: 'Hebrews 13:5',
      text: 'Keep your lives free from the love of money and be content with what you have.',
      category: 'greed',
    },
    {
      reference: 'Proverbs 15:27',
      text: 'The greedy bring ruin to their households, but the one who hates bribes will live.',
      category: 'greed',
    },
    {
      reference: 'Matthew 6:24',
      text: 'No one can serve two masters. You cannot serve both God and money.',
      category: 'greed',
    },
  ],

  lust: [
    {
      reference: 'Matthew 5:28',
      text: 'Anyone who looks at a woman lustfully has already committed adultery with her in his heart.',
      category: 'lust',
    },
    {
      reference: '1 Corinthians 6:18',
      text: 'Flee from sexual immorality. Every other sin a person commits is outside the body, but the sexually immoral person sins against his own body.',
      category: 'lust',
    },
    {
      reference: 'Galatians 5:16',
      text: 'Walk by the Spirit, and you will not gratify the desires of the flesh.',
      category: 'lust',
    },
    {
      reference: 'Job 31:1',
      text: 'I made a covenant with my eyes not to look lustfully at a young woman.',
      category: 'lust',
    },
    {
      reference: '1 Thessalonians 4:3-5',
      text: 'It is God\'s will that you should be sanctified: that you should avoid sexual immorality.',
      category: 'lust',
    },
  ],

  envy: [
    {
      reference: 'Proverbs 14:30',
      text: 'A heart at peace gives life to the body, but envy rots the bones.',
      category: 'envy',
    },
    {
      reference: 'James 3:16',
      text: 'For where you have envy and selfish ambition, there you find disorder and every evil practice.',
      category: 'envy',
    },
    {
      reference: 'Galatians 5:26',
      text: 'Let us not become conceited, provoking and envying each other.',
      category: 'envy',
    },
    {
      reference: 'Proverbs 27:4',
      text: 'Anger is cruel and fury overwhelming, but who can stand before jealousy?',
      category: 'envy',
    },
    {
      reference: '1 Corinthians 13:4',
      text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.',
      category: 'envy',
    },
  ],

  gluttony: [
    {
      reference: 'Proverbs 23:20-21',
      text: 'Do not join those who drink too much wine or gorge themselves on meat, for drunkards and gluttons become poor.',
      category: 'gluttony',
    },
    {
      reference: 'Philippians 3:19',
      text: 'Their destiny is destruction, their god is their stomach, and their glory is in their shame.',
      category: 'gluttony',
    },
    {
      reference: '1 Corinthians 10:31',
      text: 'So whether you eat or drink or whatever you do, do it all for the glory of God.',
      category: 'gluttony',
    },
    {
      reference: 'Proverbs 25:16',
      text: 'If you find honey, eat just enough—too much of it, and you will vomit.',
      category: 'gluttony',
    },
    {
      reference: 'Ecclesiastes 10:17',
      text: 'Blessed is the land whose king is of noble birth and whose princes eat at a proper time—for strength and not for drunkenness.',
      category: 'gluttony',
    },
  ],

  wrath: [
    {
      reference: 'Proverbs 29:11',
      text: 'Fools give full vent to their rage, but the wise bring calm in the end.',
      category: 'wrath',
    },
    {
      reference: 'James 1:19-20',
      text: 'Everyone should be quick to listen, slow to speak and slow to become angry, because human anger does not produce the righteousness that God desires.',
      category: 'wrath',
    },
    {
      reference: 'Ephesians 4:26-27',
      text: 'In your anger do not sin. Do not let the sun go down while you are still angry, and do not give the devil a foothold.',
      category: 'wrath',
    },
    {
      reference: 'Proverbs 15:1',
      text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.',
      category: 'wrath',
    },
    {
      reference: 'Colossians 3:8',
      text: 'But now you must also rid yourselves of all such things as these: anger, rage, malice, slander, and filthy language.',
      category: 'wrath',
    },
  ],

  sloth: [
    {
      reference: 'Proverbs 13:4',
      text: 'A sluggard\'s appetite is never filled, but the desires of the diligent are fully satisfied.',
      category: 'sloth',
    },
    {
      reference: 'Proverbs 6:6',
      text: 'Go to the ant, you sluggard; consider its ways and be wise!',
      category: 'sloth',
    },
    {
      reference: 'Colossians 3:23',
      text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.',
      category: 'sloth',
    },
    {
      reference: '2 Thessalonians 3:10',
      text: 'The one who is unwilling to work shall not eat.',
      category: 'sloth',
    },
    {
      reference: 'Ecclesiastes 10:18',
      text: 'Through laziness, the rafters sag; because of idle hands, the house leaks.',
      category: 'sloth',
    },
  ],
};

export const SIN_LABELS: Record<SinCategory, string> = {
  pride: 'Pride',
  greed: 'Greed',
  lust: 'Lust',
  envy: 'Envy',
  gluttony: 'Gluttony',
  wrath: 'Wrath',
  sloth: 'Sloth',
};

export const SIN_ICONS: Record<SinCategory, string> = {
  pride: '👑',
  greed: '💰',
  lust: '🔥',
  envy: '👁',
  gluttony: '🍷',
  wrath: '⚔',
  sloth: '🦥',
};

export function getRandomVerse(category?: SinCategory): ScriptureVerse {
  if (category) {
    const verses = SCRIPTURE_BY_SIN[category];
    return verses[Math.floor(Math.random() * verses.length)];
  }
  const allCategories = Object.keys(SCRIPTURE_BY_SIN) as SinCategory[];
  const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
  return getRandomVerse(randomCategory);
}

export function getAllVerses(): ScriptureVerse[] {
  return Object.values(SCRIPTURE_BY_SIN).flat();
}
