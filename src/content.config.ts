import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// notebook-style file status
export const statuses = ['writing', 'finished', 'pwned'] as const;
export type Status = (typeof statuses)[number];
export const statusLabel: Record<Status, string> = {
  writing: 'writing',
  finished: 'finished',
  pwned: 'pwned',
};

const entry = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  // MITRE ATT&CK IDs, e.g. T1003.001
  attack: z.array(z.string().regex(/^T\d{4}(\.\d{3})?$/)).default([]),
  status: z.enum(statuses).default('writing'),
  draft: z.boolean().default(false),
  // pinned on the home page
  featured: z.boolean().default(false),
  repo: z.string().url().optional(),
});

// files starting with _ are ignored (templates)
const fromDir = (dir: string) =>
  defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: `./src/content/${dir}` }),
    schema: entry,
  });

export const collections = {
  research: fromDir('research'),
  writeups: fromDir('write-ups'),
  labs: fromDir('labs'),
  tools: fromDir('tools'),
};
