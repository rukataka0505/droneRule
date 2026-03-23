import { c as createComponent, r as renderComponent, a as renderTemplate, b as createAstro } from '../chunks/astro/server_DoBz0lcz.mjs';
import 'piccolore';
import { s as starlightConfig, B as BuiltInDefaultLocale, g as getEntry, a as getCollectionPathFromRoot, p as project } from '../chunks/translations_BeKPTvqI.mjs';
import { n as normalizeCollectionEntry, $ as $$Common } from '../chunks/common_Bjc-kzVr.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = true;
const $$404 = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$404;
  const { lang = BuiltInDefaultLocale.lang, dir = BuiltInDefaultLocale.dir } = starlightConfig.defaultLocale || {};
  let locale = starlightConfig.defaultLocale?.locale;
  if (locale === "root") locale = void 0;
  const entryMeta = { dir, lang, locale };
  const fallbackEntry = {
    slug: "404",
    id: "404",
    body: "",
    collection: "docs",
    data: {
      title: "404",
      template: "splash",
      editUrl: false,
      head: [],
      hero: { tagline: Astro2.locals.t("404.text"), actions: [] },
      pagefind: false,
      sidebar: { hidden: false, attrs: {} },
      draft: false
    },
    filePath: `${getCollectionPathFromRoot("docs", project)}/404.md`
  };
  const userEntry = await getEntry("docs", "404");
  const entry = userEntry ? normalizeCollectionEntry(userEntry) : fallbackEntry;
  const route = { ...entryMeta, entryMeta, entry, id: entry.id, slug: entry.slug };
  return renderTemplate`${renderComponent($$result, "CommonPage", $$Common, { "route": route })}`;
}, "C:/Users/rukat/Downloads/\u30C9\u30ED\u30FC\u30F3\u8CC7\u683C\u3000\u6559\u5247/drone-license-docs/node_modules/@astrojs/starlight/routes/static/404.astro", void 0);

const $$file = "C:/Users/rukat/Downloads/ドローン資格　教則/drone-license-docs/node_modules/@astrojs/starlight/routes/static/404.astro";
const $$url = undefined;

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$404,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
