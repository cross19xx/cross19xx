import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

export async function GET(context) {
  const blog = await getCollection('blog');

  return rss({
    title: 'Blog - Kenneth Kwakye-Gyamfi',
    description:
      'Notes on building software, making pictures, and the places the two overlap. Written slowly, published occasionally.',
    site: context.site,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `${context.site.url}/posts/${post.id}`,
    })),
  });
}
