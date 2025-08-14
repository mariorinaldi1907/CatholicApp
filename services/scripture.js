const SUGGESTIONS = {
  1: [
    { ref: 'Ps 34:18', text: 'The Lord is close to the brokenhearted.' },
    { ref: 'Mt 11:28', text: 'Come to me, all who labor and are burdened…' },
  ],
  2: [
    { ref: 'Is 41:10', text: 'Do not fear, for I am with you.' },
  ],
  3: [
    { ref: 'Phil 4:6-7', text: 'By prayer and petition, with thanksgiving…' },
  ],
  4: [
    { ref: 'Ps 23:1', text: 'The Lord is my shepherd; there is nothing I lack.' },
  ],
  5: [
    { ref: 'Phil 4:4', text: 'Rejoice in the Lord always.' },
  ],
};

export function verseForScore(score) {
  const list = SUGGESTIONS[score] || [];
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}