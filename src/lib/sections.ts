import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export const sections = {
  research: {
    type: 'research',
    collection: 'research',
    name: 'The Observatory',
    kicker: 'research & deep dives',
    blurb: 'Deep dives, notes and whatever I am digging into.',
    pt: {
      blurb: '_Deep dives_, anotações e o que eu estiver investigando.',
    },
  },
  'write-ups': {
    type: 'writeup',
    collection: 'writeups',
    name: 'The Hunts',
    kicker: 'boxes, ctfs & labs',
    blurb: 'Machines and challenges, start to finish. Retired boxes only.',
    pt: {
      blurb: 'Máquinas e desafios, do começo ao fim. Só _boxes_ aposentadas.',
    },
  },
  labs: {
    type: 'lab',
    collection: 'labs',
    name: 'The Altar',
    kicker: 'built to be broken',
    blurb: 'Environments I build to break and to defend.',
    pt: {
      blurb: 'Ambientes que eu monto para quebrar e para defender.',
    },
  },
  tools: {
    type: 'tool',
    collection: 'tools',
    name: 'The Armory',
    kicker: 'pocs, scripts & tooling',
    blurb: 'Proofs of concept, scripts and tooling.',
    pt: {
      blurb: 'PoCs, scripts e _tooling_.',
    },
  },
} as const;

export type SectionKey = keyof typeof sections;
export const sectionKeys = Object.keys(sections) as SectionKey[];
export type Entry = CollectionEntry<'research' | 'writeups' | 'labs' | 'tools'>;

// section copy in the page language, names stay in english
export const sec = (s: SectionKey, lang: Lang = 'en') => {
  const { type, name, kicker, blurb, pt } = sections[s];
  return { type, name, kicker, blurb: lang === 'pt' ? pt.blurb : blurb };
};

// "The Observatory" -> "Observatory"
export const shortName = (s: SectionKey, _lang: Lang = 'en') => sections[s].name.replace(/^The /, '');

// translations live in a pt/ folder next to the original
const isPt = (e: Entry) => e.id.startsWith('pt/');
export const slugOf = (e: Entry) => e.id.replace(/^pt\//, '');
export const isTranslated = (e: Entry, lang: Lang) => lang === 'en' || isPt(e);

// english entries, swapped for the translation when there is one
export async function getEntries(section: SectionKey, lang: Lang = 'en') {
  const items = (await getCollection(
    sections[section].collection,
    ({ data }) => import.meta.env.DEV || !data.draft,
  )) as Entry[];
  const pt = new Map(items.filter(isPt).map((e) => [slugOf(e), e]));
  return items
    .filter((e) => !isPt(e))
    .map((e) => (lang === 'pt' && pt.get(e.id)) || e)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getLatest(limit = 5, lang: Lang = 'en') {
  const all = await Promise.all(
    sectionKeys.map(async (section) =>
      (await getEntries(section, lang)).map((entry) => ({ section, entry })),
    ),
  );
  return all
    .flat()
    .sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
    .slice(0, limit);
}

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

export async function getFeatured(lang: Lang = 'en') {
  return (await getLatest(100, lang)).find(({ entry }) => entry.data.featured);
}
