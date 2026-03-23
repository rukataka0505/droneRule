import { c as createComponent, r as renderComponent, a as renderTemplate, b as createAstro } from '../chunks/astro/server_DoBz0lcz.mjs';
import 'piccolore';
import { $ as $$Common, p as paths } from '../chunks/common_Bjc-kzVr.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = true;
async function getStaticPaths() {
  return paths;
}
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return renderTemplate`${renderComponent($$result, "CommonPage", $$Common, { "route": Astro2.props })}`;
}, "C:/Users/rukat/Downloads/\u30C9\u30ED\u30FC\u30F3\u8CC7\u683C\u3000\u6559\u5247/drone-license-docs/node_modules/@astrojs/starlight/routes/static/index.astro", void 0);

const $$file = "C:/Users/rukat/Downloads/ドローン資格　教則/drone-license-docs/node_modules/@astrojs/starlight/routes/static/index.astro";
const $$url = undefined;

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	getStaticPaths,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
