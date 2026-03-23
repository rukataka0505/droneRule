import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'ドローン２等資格 教則',
      social: {
        github: 'https://github.com/withastro/starlight',
      },
      sidebar: [
        {
          label: '教則目次',
          autogenerate: { directory: 'guides' },
        },
      ],
    }),
  ],
});
