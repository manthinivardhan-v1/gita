/* Katha — the narrative frame around the 700 verses. */
(function () {
  const PROLOGUE = [
    { kicker: 'PROLOGUE · I', title: 'Before Time Was Counted', mood: 'S',
      text: 'At the turning of the ages, as the Dvapara Yuga wanes into Kali, the heavens hold their breath above a single field on Earth — Kurukshetra, the field of dharma.' },
    { kicker: 'PROLOGUE · II', title: 'Two Armies, One Blood', mood: 'A', kala: .25,
      text: 'Eighteen vast armies stand face to face. On one side the Kauravas, led by Duryodhana. On the other the five Pandava brothers. They are cousins — the same blood, ready to be spilled.' },
    { kicker: 'PROLOGUE · III', title: 'The Blind King', mood: 'D',
      text: 'Far away in the palace of Hastinapura sits the blind king Dhritarashtra. The sage Vyasa has granted his charioteer Sanjaya divine sight, so that he may see every moment of the war — and tell it.' },
    { kicker: 'PROLOGUE · IV', title: 'The Conches Roar', mood: 'K', conch: true,
      text: 'Bhishma blows his conch like a lion’s roar. Then Krishna lifts Panchajanya, and Arjuna sounds Devadatta. The sound tears through earth and sky, and the hearts of the Kauravas tremble.' },
    { kicker: 'PROLOGUE · V', title: 'Between the Two Armies', mood: 'A',
      text: 'Arjuna, the greatest archer of the age, asks his charioteer — Krishna himself — to drive the chariot into the space between the two armies, so he may look upon those he must fight.' },
    { kicker: 'PROLOGUE · VI', title: 'The Bow Slips', mood: 'A', kala: .15,
      text: 'He sees grandfathers, teachers, uncles, brothers, sons and friends. His limbs fail, his mouth runs dry, and the mighty bow Gandiva slips from his hand. He cannot fight.' },
    { kicker: 'PROLOGUE · VII', title: 'The Song of God', mood: 'K', burst: true,
      text: 'And there, in the silence between two armies, while time itself stands still, the Lord of the universe smiles — and begins to sing. This is the Bhagavad Gita.' },
  ];

  const EPILOGUE = { kicker: 'ॐ तत् सत्', title: 'Where Krishna Is, There Is Victory', mood: 'K',
    text: 'Arjuna rises, his delusion destroyed, his memory restored. He lifts Gandiva once more. Sanjaya’s hair stands on end as he remembers the wondrous form of Hari. Wherever there is Krishna, the Lord of Yoga, and Arjuna, the archer — there are fortune, victory, glory and righteousness. Om Tat Sat.' };

  // colour worlds for each voice — [deep, mid, highlight]
  const PALETTES = {
    K: [[0.02, 0.05, 0.28], [0.0, 0.55, 0.7], [1.0, 0.75, 0.22]],   // Krishna: indigo, peacock, gold
    A: [[0.35, 0.02, 0.12], [0.75, 0.25, 0.9], [1.0, 0.5, 0.15]],   // Arjuna: crimson, amethyst, saffron
    S: [[0.18, 0.03, 0.35], [0.9, 0.2, 0.7], [0.2, 0.85, 1.0]],     // Sanjaya: violet, magenta, cyan
    D: [[0.05, 0.02, 0.08], [0.3, 0.12, 0.4], [0.55, 0.5, 0.7]],    // Dhritarashtra: darkness
    KALA: [[0.25, 0.0, 0.0], [1.0, 0.18, 0.0], [1.0, 0.8, 0.3]],    // Kāla: the fire of time
  };
  const ACCENTS = { K: '#ffcf6b', A: '#ff8a5c', S: '#d58bff', D: '#b9a8d9', KALA: '#ff5a2a' };
  const SPEAKERS = {
    K: { sa: 'श्रीभगवानुवाच', en: 'Krishna speaks' },
    A: { sa: 'अर्जुन उवाच', en: 'Arjuna speaks' },
    S: { sa: 'सञ्जय उवाच', en: 'Sanjaya speaks' },
    D: { sa: 'धृतराष्ट्र उवाच', en: 'Dhritarashtra speaks' },
  };

  // The Vishwaroop arc through Chapter 11: [vis, kala, sun]
  function vishwaFor(ch, v) {
    if (ch !== 11) return { vis: 0, kala: 0, sun: 0 };
    if (v <= 4) return { vis: 0.04 * v, kala: 0, sun: 0 };
    if (v <= 7) return { vis: 0.2 + (v - 5) * 0.05, kala: 0, sun: 0 };
    if (v === 8) return { vis: 0.4, kala: 0, sun: 0.4 };          // "I give you divine eyes"
    if (v <= 11) return { vis: 0.55 + (v - 9) * 0.12, kala: 0, sun: 0 };
    if (v === 12) return { vis: 1, kala: 0, sun: 1, hold: true }; // a thousand suns
    if (v <= 22) return { vis: 1, kala: 0, sun: 0 };
    if (v <= 31) return { vis: 1, kala: 0.25 + (v - 23) * 0.08, sun: 0 }; // the blazing mouths
    if (v === 32) return { vis: 1, kala: 1, sun: 0 };             // "Time I am"
    if (v <= 34) return { vis: 1, kala: 0.8, sun: 0 };
    if (v <= 46) return { vis: 0.95, kala: Math.max(0, 0.5 - (v - 35) * 0.05), sun: 0 };
    if (v <= 49) return { vis: 0.6 - (v - 47) * 0.12, kala: 0, sun: 0 };
    if (v === 50) return { vis: 0.2, kala: 0, sun: 0 };
    return { vis: 0.05, kala: 0, sun: 0 };
  }

  // Verses that shake the cosmos: [ch.v] → giant word & extra fx
  const EPIC = {
    '1.1': 'धर्मक्षेत्रे', '2.20': 'न जायते', '2.47': 'कर्मणि', '2.22': 'वासांसि',
    '3.35': 'स्वधर्मे', '4.7': 'यदा यदा', '4.8': 'सम्भवामि', '6.5': 'उद्धरेत्', '7.7': 'मणिगणा',
    '9.22': 'योगक्षेमं', '9.26': 'पत्रं पुष्पं', '10.20': 'अहमात्मा', '10.8': 'अहं सर्वस्य',
    '11.5': 'पश्य मे', '11.8': 'दिव्यं चक्षुः', '11.12': 'सूर्यसहस्रस्य', '11.13': 'जगत्कृत्स्नं', '11.16': 'अनन्तरूपम्',
    '11.19': 'शशिसूर्यनेत्रम्', '11.24': 'नभःस्पृशं', '11.28': 'नदीनां', '11.29': 'पतङ्गा', '11.32': 'कालोऽस्मि',
    '11.33': 'निमित्तमात्रं', '11.40': 'सर्वः', '11.53': 'नाहं वेदैः', '12.13': 'अद्वेष्टा', '13.2': 'क्षेत्रज्ञ',
    '15.1': 'अश्वत्थं', '15.15': 'सर्वस्य', '18.66': 'मामेकं शरणं', '18.73': 'नष्टो मोहः', '18.78': 'यत्र योगेश्वरः',
  };

  window.Katha = { PROLOGUE, EPILOGUE, PALETTES, ACCENTS, SPEAKERS, vishwaFor, EPIC };
})();
