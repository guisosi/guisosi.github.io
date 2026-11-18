import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getLatest, sections } from '../lib/sections';

export async function GET(context: APIContext) {
  const items = await getLatest(50);
  return rss({
    title: 'guisosi',
    description: 'Offensive security research, write-ups, labs and tools.',
    site: context.site!,
    items: items.map(({ section, entry }) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/${section}/${entry.id}/`,
      categories: [sections[section].type, ...entry.data.tags],
    })),
  });
}
