// Bible verses for the footer - randomly selected on each page load
export const footerVerses = [
  { reference: 'Genesis 3:1–19', text: 'The serpent deceived Eve, and sin entered the world through disobedience.' },
  { reference: 'Leviticus 5:5', text: 'When anyone becomes aware that they are guilty, they must confess in what way they have sinned.' },
  { reference: 'Psalm 32:3–5', text: 'When I kept silent, my bones wasted away... Then I acknowledged my sin to you and did not cover up my iniquity.' },
  { reference: 'Psalm 51:10', text: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.' },
  { reference: 'Proverbs 28:13', text: 'Whoever conceals their sins does not prosper, but the one who confesses and renounces them finds mercy.' },
  { reference: 'Isaiah 1:18', text: 'Though your sins are like scarlet, they shall be as white as snow.' },
  { reference: 'Isaiah 55:6–7', text: 'Seek the Lord while he may be found; call on him while he is near. Let the wicked forsake their ways.' },
  { reference: 'Daniel 9:9', text: 'The Lord our God is merciful and forgiving, even though we have rebelled against him.' },
  { reference: 'Matthew 3:6', text: 'Confessing their sins, they were baptized by him in the Jordan River.' },
  { reference: 'Luke 15:21', text: 'The son said, "Father, I have sinned against heaven and against you. I am no longer worthy to be called your son."' },
  { reference: 'James 5:16', text: 'Therefore confess your sins to each other and pray for each other so that you may be healed.' },
  { reference: '1 John 1:9', text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.' },
];

export function getRandomVerse() {
  return footerVerses[Math.floor(Math.random() * footerVerses.length)];
}
