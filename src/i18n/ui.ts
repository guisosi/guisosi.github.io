// site copy, english is the source
export const langs = ['en', 'pt'] as const;
export type Lang = (typeof langs)[number];

export const htmlLang: Record<Lang, string> = { en: 'en', pt: 'pt-BR' };
export const ogLocale: Record<Lang, string> = { en: 'en_US', pt: 'pt_BR' };

// '/research/x/' -> '/pt/research/x/'
export const localize = (lang: Lang, path: string) => (lang === 'pt' ? `/pt${path === '/' ? '/' : path}` : path);

// '/pt/research/x/' -> '/research/x/'
export const unlocalize = (path: string) => path.replace(/^\/pt(\/|$)/, '/');

export const langFromPath = (path: string): Lang => (/^\/pt(\/|$)/.test(path) ? 'pt' : 'en');

const en = {
  'site.description': 'guisosi. Red team research, write-ups, labs and tools.',
  'site.tagline': 'still learning. never done.',
  'site.skip': 'skip to content',
  'nav.about': 'About',
  'nav.lang': 'language',
  'foot.legal': 'All content is for study and for use in your own environments or with written authorization.',

  'home.kicker': 'hunting the next shell',
  'home.h1a': 'Still learning.',
  'home.h1b': 'Never done.',
  'home.lead': 'Offensive security research, write-ups and labs. An eternal student of the adversary’s mind.',
  'home.small': 'Just code, notes and the relentless pursuit of how things break.',
  'home.cta1': 'Enter the Observatory',
  'home.cta2': 'Read the Hunts',
  'home.art': 'Painted figure pulling the strings of a puppet',
  'home.artTitle1': 'Who pulls',
  'home.artTitle2': 'the strings?',
  'home.artSub': '// still watching.',
  'home.road': 'the road',
  'home.noteKicker': 'note to self',
  'home.note': ['Enumerate everything.', 'Break it in the lab.', 'Write it down.', 'Own the domain.'],
  'home.quote1': 'Late nights in the lab.',
  'home.quote2': 'Quiet progress.',
  'home.sanctum': 'the sanctum',
  'home.rooms1': 'Four rooms.',
  'home.rooms2': 'One operator.',
  'home.case': 'case file',
  'home.read': 'Read the research',
  'home.latest': 'latest',
  'home.latest1': 'Fresh from',
  'home.latest2': 'the dark.',
  'home.github': 'from github',
  'home.projects': 'Projects.',
  'home.rulesKicker': 'rules of engagement',
  'home.rules1': 'Authorized.',
  'home.rules2': 'Always.',
  'home.rules': [
    'Everything here runs in my own labs, on retired machines or under written authorization.',
    'No client data. No internal IPs, hostnames or credentials. Ever.',
    'Prove the impact. Take only what proves it.',
  ],

  'list.empty': 'Nothing here yet. Still learning.',
  'list.more': 'Read more',
  'list.entry': 'entry',
  'list.entries': 'entries',

  'post.file': 'FILE №',
  'post.operator': 'Operator',
  'post.status': 'Status',
  'post.updated': 'Updated',
  'post.tags': 'Tags',
  'post.end': 'end of file №',
  'post.back': 'back to',
  'post.untranslated': '',

  'status.writing': 'writing',
  'status.finished': 'finished',
  'status.pwned': 'pwned',
  'status.draft': 'draft',

  'road.done': 'done',
  'road.wip': 'in progress',
  'road.next': 'next',
  'road.goal': 'goal',
};

type Dict = { [K in keyof typeof en]: (typeof en)[K] extends string[] ? string[] : string };

// pt only overrides what reads as text; names, slogans and file labels stay in english
const pt: Dict = {
  ...(en as Dict),
  'site.description': 'guisosi. Pesquisa de _red team_, _write-ups_, _labs_ e _tools_.',
  'site.skip': 'pular para o conteúdo',
  'nav.about': 'Sobre',
  'nav.lang': 'idioma',
  'foot.legal': 'Todo o conteúdo é para estudo e para uso nos seus próprios ambientes ou com autorização por escrito.',

  'home.small': 'Só código, anotações e a busca incansável por entender como as coisas quebram.',
  'home.cta1': 'Entrar no Observatory',
  'home.cta2': 'Ler as Hunts',
  'home.art': 'Figura pintada puxando os fios de uma marionete',
  'home.read': 'Ler a pesquisa',
  'home.rules': [
    'Tudo aqui roda nos meus próprios _labs_, em máquinas aposentadas ou com autorização por escrito.',
    'Nada de dado de cliente. Nada de IP interno, _hostname_ ou credencial. Nunca.',
    'Provar o impacto. Levar só o que prova.',
  ],

  'list.empty': 'Nada aqui ainda. _Still learning._',
  'list.more': 'Ler mais',
  'list.entry': 'entrada',
  'list.entries': 'entradas',

  'post.back': 'voltar para',
  'post.untranslated': 'Este post ainda não foi traduzido. Abaixo, a versão em inglês.',
};

const dicts: Record<Lang, Dict> = { en: en as Dict, pt };

export function useT(lang: Lang) {
  const d = dicts[lang];
  function t<K extends keyof Dict>(key: K): Dict[K] {
    return d[key];
  }
  return t;
}

// _term_ marks a foreign word: <em> on the page, plain text in meta tags
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const MARK = /(^|[^\w])_([^_]+?)_(?![\w])/g;
export const rich = (s: string) => esc(s).replace(MARK, '$1<em>$2</em>');
export const plain = (s: string) => s.replace(MARK, '$1$2');
