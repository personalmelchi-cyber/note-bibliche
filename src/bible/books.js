// I 66 libri, nell'ordine standard (1 = Genesi ... 66 = Apocalisse).
// Questo numero è lo stesso usato da Bolls e getBible.
// `names`: nome mostrato nella lingua della traduzione scelta.
// `aliases`: abbreviazioni e varianti accettate nella ricerca, in tutte le lingue:
//   si può scrivere "Giovanni 3:16", "John 3:16" o "Іван 3:16" con qualsiasi traduzione.
// Maiuscole, accenti, punteggiatura e spazi non contano (vengono normalizzati).
export const BOOKS = [
  { n: 1, names: { it: "Genesi", en: "Genesis", uk: "Буття" }, aliases: ["gen", "gn", "бут"] },
  { n: 2, names: { it: "Esodo", en: "Exodus", uk: "Вихід" }, aliases: ["es", "eso", "ex", "exod", "вих"] },
  { n: 3, names: { it: "Levitico", en: "Leviticus", uk: "Левит" }, aliases: ["lev", "lv", "лев"] },
  { n: 4, names: { it: "Numeri", en: "Numbers", uk: "Числа" }, aliases: ["num", "nm", "чис"] },
  { n: 5, names: { it: "Deuteronomio", en: "Deuteronomy", uk: "Повторення Закону" }, aliases: ["deut", "dt", "повт"] },
  { n: 6, names: { it: "Giosuè", en: "Joshua", uk: "Ісуса Навина" }, aliases: ["gios", "gs", "josh", "ісус", "навин", "нав"] },
  { n: 7, names: { it: "Giudici", en: "Judges", uk: "Судді" }, aliases: ["giud", "gdc", "judg", "jdg", "суд"] },
  { n: 8, names: { it: "Rut", en: "Ruth", uk: "Рут" }, aliases: ["rt"] },
  { n: 9, names: { it: "1 Samuele", en: "1 Samuel", uk: "1 Самуїла" }, aliases: ["1sam", "1sm", "1сам"] },
  { n: 10, names: { it: "2 Samuele", en: "2 Samuel", uk: "2 Самуїла" }, aliases: ["2sam", "2sm", "2сам"] },
  { n: 11, names: { it: "1 Re", en: "1 Kings", uk: "1 Царів" }, aliases: ["1re", "1kgs", "1ki", "1цар"] },
  { n: 12, names: { it: "2 Re", en: "2 Kings", uk: "2 Царів" }, aliases: ["2re", "2kgs", "2ki", "2цар"] },
  { n: 13, names: { it: "1 Cronache", en: "1 Chronicles", uk: "1 Хронік" }, aliases: ["1cron", "1cr", "1chr", "1хр", "1хрон"] },
  { n: 14, names: { it: "2 Cronache", en: "2 Chronicles", uk: "2 Хронік" }, aliases: ["2cron", "2cr", "2chr", "2хр", "2хрон"] },
  { n: 15, names: { it: "Esdra", en: "Ezra", uk: "Ездри" }, aliases: ["esd", "esdr", "ezr", "ездра", "ездр"] },
  { n: 16, names: { it: "Neemia", en: "Nehemiah", uk: "Неемії" }, aliases: ["ne", "nee", "neh", "неемія", "неєм"] },
  { n: 17, names: { it: "Ester", en: "Esther", uk: "Естер" }, aliases: ["est", "esth", "есф"] },
  { n: 18, names: { it: "Giobbe", en: "Job", uk: "Йова" }, aliases: ["giob", "gb", "йов"] },
  { n: 19, names: { it: "Salmo", en: "Psalm", uk: "Псалом" }, aliases: ["salmi", "sal", "sl", "ps", "psa", "psalms", "псалми", "пс"] },
  { n: 20, names: { it: "Proverbi", en: "Proverbs", uk: "Приповістей" }, aliases: ["prov", "pr", "прип", "приповісті", "притчі"] },
  { n: 21, names: { it: "Ecclesiaste", en: "Ecclesiastes", uk: "Екклезіяста" }, aliases: ["eccl", "ec", "ecc", "qoelet", "qo", "qoh", "екк", "екклезіяст"] },
  { n: 22, names: { it: "Cantico dei Cantici", en: "Song of Solomon", uk: "Пісня над піснями" }, aliases: ["cantico", "cant", "ct", "song", "sos", "sng", "пісн"] },
  { n: 23, names: { it: "Isaia", en: "Isaiah", uk: "Ісаї" }, aliases: ["is", "isa", "іс", "ісая"] },
  { n: 24, names: { it: "Geremia", en: "Jeremiah", uk: "Єремії" }, aliases: ["ger", "gr", "jer", "єр", "єрем", "єремія"] },
  { n: 25, names: { it: "Lamentazioni", en: "Lamentations", uk: "Плач Єремії" }, aliases: ["lam", "lm", "плач"] },
  { n: 26, names: { it: "Ezechiele", en: "Ezekiel", uk: "Єзекіїля" }, aliases: ["ez", "ezech", "ezek", "eze", "єз", "єзекіїль"] },
  { n: 27, names: { it: "Daniele", en: "Daniel", uk: "Даниїла" }, aliases: ["dan", "dn", "даниїл"] },
  { n: 28, names: { it: "Osea", en: "Hosea", uk: "Осії" }, aliases: ["os", "hos", "осія"] },
  { n: 29, names: { it: "Gioele", en: "Joel", uk: "Йоїла" }, aliases: ["gl", "gioe", "йоїл", "йоіл"] },
  { n: 30, names: { it: "Amos", en: "Amos", uk: "Амоса" }, aliases: ["am", "ам"] },
  { n: 31, names: { it: "Abdia", en: "Obadiah", uk: "Овдія" }, aliases: ["abd", "obad", "oba", "овд", "овдій"] },
  { n: 32, names: { it: "Giona", en: "Jonah", uk: "Йони" }, aliases: ["gion", "gna", "jon", "йона", "йон"] },
  { n: 33, names: { it: "Michea", en: "Micah", uk: "Михея" }, aliases: ["mic", "mi", "мих", "михей"] },
  { n: 34, names: { it: "Naum", en: "Nahum", uk: "Наума" }, aliases: ["na", "nah", "наум"] },
  { n: 35, names: { it: "Abacuc", en: "Habakkuk", uk: "Авакума" }, aliases: ["abac", "ab", "hab", "авакум", "авак"] },
  { n: 36, names: { it: "Sofonia", en: "Zephaniah", uk: "Софонії" }, aliases: ["sof", "zeph", "софонія"] },
  { n: 37, names: { it: "Aggeo", en: "Haggai", uk: "Огія" }, aliases: ["agg", "hag", "огій", "аггей"] },
  { n: 38, names: { it: "Zaccaria", en: "Zechariah", uk: "Захарії" }, aliases: ["zac", "zech", "захарія"] },
  { n: 39, names: { it: "Malachia", en: "Malachi", uk: "Малахії" }, aliases: ["mal", "малахія"] },
  { n: 40, names: { it: "Matteo", en: "Matthew", uk: "Матвія" }, aliases: ["mt", "matt", "матвій", "мт", "мф"], gospel: true },
  { n: 41, names: { it: "Marco", en: "Mark", uk: "Марка" }, aliases: ["mc", "mar", "mk", "марко", "мр", "мк"], gospel: true },
  { n: 42, names: { it: "Luca", en: "Luke", uk: "Луки" }, aliases: ["lc", "luc", "lk", "лука", "лк"], gospel: true },
  { n: 43, names: { it: "Giovanni", en: "John", uk: "Івана" }, aliases: ["gv", "gio", "giov", "jn", "іван", "ів"], gospel: true },
  { n: 44, names: { it: "Atti", en: "Acts", uk: "Дії" }, aliases: ["at", "attidegliapostoli", "ac", "діїапостолів"] },
  { n: 45, names: { it: "Romani", en: "Romans", uk: "Римлян" }, aliases: ["rm", "rom", "рим", "римляни"] },
  { n: 46, names: { it: "1 Corinzi", en: "1 Corinthians", uk: "1 Коринтян" }, aliases: ["1cor", "1co", "1кор"] },
  { n: 47, names: { it: "2 Corinzi", en: "2 Corinthians", uk: "2 Коринтян" }, aliases: ["2cor", "2co", "2кор"] },
  { n: 48, names: { it: "Galati", en: "Galatians", uk: "Галатів" }, aliases: ["gal", "ga", "гал", "галати"] },
  { n: 49, names: { it: "Efesini", en: "Ephesians", uk: "Ефесян" }, aliases: ["ef", "eph", "еф", "ефесяни"] },
  { n: 50, names: { it: "Filippesi", en: "Philippians", uk: "Филип'ян" }, aliases: ["fil", "fl", "filip", "phil", "php", "флп", "фил", "филипяни"] },
  { n: 51, names: { it: "Colossesi", en: "Colossians", uk: "Колосян" }, aliases: ["col", "кол", "колосяни"] },
  { n: 52, names: { it: "1 Tessalonicesi", en: "1 Thessalonians", uk: "1 Солунян" }, aliases: ["1tess", "1ts", "1thess", "1сол"] },
  { n: 53, names: { it: "2 Tessalonicesi", en: "2 Thessalonians", uk: "2 Солунян" }, aliases: ["2tess", "2ts", "2thess", "2сол"] },
  { n: 54, names: { it: "1 Timoteo", en: "1 Timothy", uk: "1 Тимофія" }, aliases: ["1tim", "1tm", "1тим"] },
  { n: 55, names: { it: "2 Timoteo", en: "2 Timothy", uk: "2 Тимофія" }, aliases: ["2tim", "2tm", "2тим"] },
  { n: 56, names: { it: "Tito", en: "Titus", uk: "Тита" }, aliases: ["tt", "тит"] },
  { n: 57, names: { it: "Filemone", en: "Philemon", uk: "Филимона" }, aliases: ["flm", "filem", "phlm", "phm", "филим", "флм"] },
  { n: 58, names: { it: "Ebrei", en: "Hebrews", uk: "Євреїв" }, aliases: ["eb", "heb", "євр", "євреї"] },
  { n: 59, names: { it: "Giacomo", en: "James", uk: "Якова" }, aliases: ["giac", "gc", "jas", "як", "яків"] },
  { n: 60, names: { it: "1 Pietro", en: "1 Peter", uk: "1 Петра" }, aliases: ["1pt", "1pie", "1piet", "1pet", "1пет"] },
  { n: 61, names: { it: "2 Pietro", en: "2 Peter", uk: "2 Петра" }, aliases: ["2pt", "2pie", "2piet", "2pet", "2пет"] },
  { n: 62, names: { it: "1 Giovanni", en: "1 John", uk: "1 Івана" }, aliases: ["1gv", "1gio", "1giov", "1jn", "1ів"] },
  { n: 63, names: { it: "2 Giovanni", en: "2 John", uk: "2 Івана" }, aliases: ["2gv", "2gio", "2giov", "2jn", "2ів"] },
  { n: 64, names: { it: "3 Giovanni", en: "3 John", uk: "3 Івана" }, aliases: ["3gv", "3gio", "3giov", "3jn", "3ів"] },
  { n: 65, names: { it: "Giuda", en: "Jude", uk: "Юди" }, aliases: ["gd", "gda", "юд", "юда"] },
  { n: 66, names: { it: "Apocalisse", en: "Revelation", uk: "Об'явлення" }, aliases: ["ap", "apoc", "rev", "об", "одкровення", "откр"] },
];

// Normalizza: minuscole, senza accenti né punteggiatura. Funziona anche col cirillico.
export const normalize = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

// Indice: nome o abbreviazione normalizzati -> libro
export const INDEX = new Map();
export const COLLISIONS = [];
function add(key, book) {
  if (!key) return;
  const prev = INDEX.get(key);
  if (prev && prev !== book) COLLISIONS.push(`${key}: ${prev.names.en} / ${book.names.en}`);
  else INDEX.set(key, book);
}
for (const b of BOOKS) {
  for (const name of Object.values(b.names)) add(normalize(name), b);
  for (const a of b.aliases) add(normalize(a), b);
}

/** Cerca un libro per nome, abbreviazione o prefisso univoco (min. 3 lettere). */
export function findBook(raw) {
  const key = normalize(raw);
  if (!key) return { error: "empty" };
  const exact = INDEX.get(key);
  if (exact) return { book: exact };
  if (key.length >= 3) {
    const hits = new Set();
    for (const [k, b] of INDEX) if (k.startsWith(key)) hits.add(b);
    if (hits.size === 1) return { book: [...hits][0] };
    if (hits.size > 1) return { error: "ambiguous", options: [...hits].map((b) => b.names.it) };
  }
  return { error: "unknown" };
}

const GOSPEL_PREFIX = { it: "Vangelo secondo", uk: "Євангеліє від" };

/** Nome come si legge nel riferimento, nella lingua indicata: "Vangelo secondo Luca", "John", "Євангеліє від Івана"... */
export function displayName(book, lang = "it") {
  const name = book.names[lang] || book.names.it;
  return book.gospel && GOSPEL_PREFIX[lang] ? `${GOSPEL_PREFIX[lang]} ${name}` : name;
}
