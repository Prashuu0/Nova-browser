const { query } = require('./pool');
const { v4: uuidv4 } = require('uuid');

const SEED_EXTENSIONS = [
  {
    slug: 'nova-dark-mode',
    name: 'Nova Dark Mode Pro',
    description: 'Enhanced dark theme for every website with Nova branding.',
    version: '1.0.0',
    author: 'Nova Team',
    category: 'appearance',
    is_featured: true,
    manifest: { permissions: ['activeTab'], content_scripts: [{ matches: ['<all_urls>'], css: ['dark.css'] }] }
  },
  {
    slug: 'nova-adblock-plus',
    name: 'Nova AdBlock Plus',
    description: 'Extra ad blocking rules powered by Nova Shields.',
    version: '2.1.0',
    author: 'Nova Team',
    category: 'privacy',
    is_featured: true,
    manifest: { permissions: ['webRequest'], content_scripts: [] }
  },
  {
    slug: 'nova-translate',
    name: 'Nova Translate',
    description: 'Translate any page with one click using Nova AI.',
    version: '1.2.0',
    author: 'Nova Team',
    category: 'productivity',
    is_featured: false,
    manifest: { permissions: ['activeTab'], content_scripts: [{ matches: ['<all_urls>'], js: ['translate.js'] }] }
  },
  {
    slug: 'nova-pdf-tools',
    name: 'Nova PDF Tools',
    description: 'Save, annotate and summarize PDFs with Nova AI.',
    version: '1.0.0',
    author: 'Nova Team',
    category: 'productivity',
    is_featured: false,
    manifest: { permissions: ['activeTab'] }
  },
  {
    slug: 'nova-youtube-focus',
    name: 'Nova YouTube Focus',
    description: 'Hide distractions on YouTube. Focus mode for students.',
    version: '1.1.0',
    author: 'Nova Team',
    category: 'productivity',
    is_featured: true,
    manifest: { permissions: ['activeTab'], content_scripts: [{ matches: ['*://*.youtube.com/*'], css: ['focus.css'] }] }
  }
];

async function seed() {
  for (const ext of SEED_EXTENSIONS) {
    await query(
      `INSERT INTO extension_catalog (id, slug, name, description, version, author, category, is_featured, manifest, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
       ON CONFLICT (slug) DO NOTHING`,
      [uuidv4(), ext.slug, ext.name, ext.description, ext.version, ext.author, ext.category, ext.is_featured, JSON.stringify(ext.manifest)]
    );
  }
  console.log('[Nova Cloud] Extension catalog seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
