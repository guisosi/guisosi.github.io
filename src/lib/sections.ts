import { getCollection } from 'astro:content';

export const sections = {
  research: {
    collection: 'research',
    name: 'The Observatory',
    kicker: 'research & deep dives',
    blurb: 'Deep dives, notes and whatever I am digging into.',
  },
  'write-ups': {
    collection: 'writeups',
    name: 'The Hunts',
    kicker: 'boxes, ctfs & labs',
    blurb: 'Machines and challenges, start to finish. Retired boxes only.',
  },
  labs: {
    collection: 'labs',
    name: 'The Altar',
    kicker: 'built to be broken',
    blurb: 'Environments I build to break and to defend.',
  },
  tools: {
    collection: 'tools',
    name: 'The Armory',
    kicker: 'pocs, scripts & tooling',
    blurb: 'Proofs of concept, scripts and tooling.',
  },
} as const;

export type SectionKey = keyof typeof sections;
export const sectionKeys = Object.keys(sections) as SectionKey[];

// "The Observatory" -> "Observatory"
export const shortName = (s: SectionKey) => sections[s].name.replace(/^The /, '');

export async function getEntries(section: SectionKey) {
  const items = await getCollection(
    sections[section].collection,
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getLatest(limit = 5) {
  const all = await Promise.all(
    sectionKeys.map(async (section) =>
      (await getEntries(section)).map((entry) => ({ section, entry })),
    ),
  );
  return all
    .flat()
    .sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
    .slice(0, limit);
}

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
