import type { State } from '@/state';
import type { Any } from '@common';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { html, raw } from 'hono/html';
import { scrollProducts } from '../metadata/scrollProducts';
import { lang } from '@/middlewares/lang';
const index = await Bun.file('../frontend/dist/index.html').text();

const tstr = async (lang: string) => {
  const r = await (await Bun.file(`../locales/${lang}.json`)).json();
  return (s: string) => {
    return r[s] as string || '';
  };
};

const withDefaultHead = async ({ lang }: { lang: string }) => {
  const t = await tstr(lang);
  const head = html`
      <meta charset="UTF-8" />
      <link rel="icon" type="image/png" href="/logo.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      <title>${t('impact_matter_priest_major')}</title>
      <meta
        name="description"
        content="${t('leading_spherical_training_member')}"
      />
      <meta property="og:title" content="${t('impact_matter_priest_major')}" />
      <meta
        property="og:description"
        content="${t('leading_spherical_training_member')}"
      />
      <meta property="og:image" content="https://emporion.network/og-image.png" />
      <meta property="og:url" content="https://emporion.network" />
      <meta property="og:site_name" content="Emporion" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${t('impact_matter_priest_major')}" />
      <script nonce="" type="application/ld+json">
        { 
          "@context":"https://schema.org",
          "@type":"Organization",
          "name":"Walmart",
          "url":"https://emporion.network",
          "logo":"https://emporion.network/logo.png",
          "sameAs":["https://x.com/EmporionNetwork", "https://github.com/emporion-Network/"]
        }
      </script>
      <meta
        name="twitter:description"
        content="${t('leading_spherical_training_member')}"
      />
      <meta name="twitter:image" content="https://emporion.network/og-image.png" />
      <meta name="twitter:site" content="@EmporionNetwork" />`;
  return html`
    <!doctype html>
    <html lang="${lang}">
      ${raw(index.replace('<!-- HEAD -->', head.toString()))}
    </html>
  `;
};

const withJSON = async ({
  json,
  lang,
  title,
  description,
  image,
}: {
  title: string
  description: string
  image: string
  lang: string
  json: Any[]
}) => {
  const head = html`
      <meta charset="UTF-8" />
      <link rel="icon" type="image/png" href="/logo.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      <title>${title}</title>
      <meta
        name="description"
        content="${description}"
      />
      <meta property="og:title" content="${title}" />
      <meta
        property="og:description"
        content="${description}"
      />
      <meta property="og:image" content="${image}" />
      <meta property="og:url" content="https://emporion.network" />
      <meta property="og:site_name" content="Emporion" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Emporion - ${title}" />
      <meta
        name="twitter:description"
        content="${description}"
      />
      <meta name="twitter:image" content="${image}" />
      <meta name="twitter:site" content="@EmporionNetwork" />
      <script nonce="" type="application/ld+json">
        { 
          "@context":"https://schema.org",
          "@type":"Organization",
          "name":"Walmart",
          "url":"https://emporion.network",
          "logo":"https://emporion.network/logo.png",
          "sameAs":["https://x.com/EmporionNetwork", "https://github.com/emporion-Network/"]
        }
      </script>
      ${json.map(e => html`
        <script type="application/ld+json">
          ${JSON.stringify(e)}
        </script>
      `)}
      `;
  return html`
  <!doctype html>
  <html lang="${lang}">
    ${raw(index.replace('<!-- HEAD -->', head.toString()))}
  </html>
`;
};

const app = new Hono<{ Variables: { state: State } }>()
  .use('*', lang)
  .get('/', async (c) => {
    return c.html(withDefaultHead({ lang: c.var.lang }));
  })
  .get('/store', async (c) => {
    const {
      limit,
      category,
      start_after,
      q,
      seller,
      sort,
      min_price,
      max_price,
    } = c.req.query();
    const t = await tstr(c.var.lang);

    const r = await scrollProducts({
      limit,
      category,
      start_after,
      q,
      seller,
      sort,
      min_price,
      max_price,
    }, c.var.state.db);
    const lang = c.var.lang;
    return c.html(withJSON({
      title: t('impact_matter_priest_major'),
      description: t('leading_spherical_training_member'),
      image: 'https://emporion.network/og-image.png',
      lang,
      json: [{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Emporion',
        'url': 'https://emporion.network',
        'logo': 'https://emporion.network/logo.png',
        'potentialAction': [
          {
            '@type': 'SearchAction',
            'target': { '@type': 'EntryPoint', 'urlTemplate': 'https://emporion.network/store?q={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        ],
        'mainEntity': {
          '@type': 'ItemList',
          'name': 'Featured Products',
          'numberOfItems': r.length,
          'itemListElement': r.map((e) => {
            return {
              '@type': 'Product',
              'name': e.title[lang],
              'description': e.description[lang],
              'image': e.gallery[lang],
              'offers': {
                '@type': 'Offer',
                'price': e.price,
                'priceCurrency': 'USD',
                'availability': e.listed ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
                'url': `https://emporion.network/product?p=${e.id}`,
                'seller': {
                  '@type': 'Organization',
                  'name': e.seller,
                },
              },
            };
          }),
        },
      }],
    }));
  })
  .use('*', serveStatic({
    root: '../frontend/dist/',
  }))
  .use('*', async (c) => {
    return c.html(withDefaultHead({ lang: c.var.lang }));
  });

export default app;
