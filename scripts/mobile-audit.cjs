// Revisión de diseño en celulares y tablet. Uso: node scripts/mobile-audit.cjs [url]  (requiere Playwright)
// Detecta: desbordes horizontales, columnas vacías que angostan el contenido y títulos apilados palabra por palabra.
const { chromium, devices } = require('playwright');
const B = process.argv[2] || 'http://localhost:3100';
const PAGES = ['/', '/propiedades', '/propiedades?operacion=venta', '/propiedades?barrio=General%20Pir%C3%A1n', '/propiedades?barrio=Puerto%20Madero',
  '/propiedades?vista=mapa', '/propiedades/quinta-13-ha-frente-autovia-2-general-piran', '/propiedades/casa-racionalista-con-jardin-san-isidro',
  '/tasaciones', '/nosotros', '/contacto', '/favoritos', '/comparar', '/panel/ingresar'];
const DEVICES = [['iPhone SE', devices['iPhone SE']], ['iPhone 13', devices['iPhone 13']], ['Pixel 7', devices['Pixel 7']], ['iPad Mini', devices['iPad Mini']]];
(async () => {
  const b = await chromium.launch(); let problems = 0;
  for (const [dn, dev] of DEVICES) {
    const p = await (await b.newContext(dev)).newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    for (const u of PAGES) {
      await p.goto(B + u, { waitUntil: 'networkidle' });
      for (let y = 0; y < 20000; y += 700) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(40); }
      await p.waitForTimeout(250);
      const r = await p.evaluate(() => {
        const vw = innerWidth, out = [];
        if (document.documentElement.scrollWidth > vw + 1) out.push(`scroll horizontal ${document.documentElement.scrollWidth - vw}px`);
        const main = document.querySelector('main');
        // bloques de contenido principales que quedaron angostos o corridos
        for (const el of main.querySelectorAll('h1, h2, .pcard, .listing__results, .pdetail__main, .cbox, .svc__row, .hguide__row, .valuer__body, .directory__row, form, .empty')) {
          const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') continue;
          const rc = el.getBoundingClientRect(); if (rc.width === 0 || rc.height === 0) continue;
          if (el.closest('.filters, dialog, .reel__card, .mbar, .lightbox, .hguide__panel, .leaflet-container')) continue;
          if (rc.right > vw + 1) out.push(`se sale: ${el.tagName}.${el.className.split(' ')[0]} (${Math.round(rc.right - vw)}px)`);
          const cw = Math.min(vw, document.documentElement.clientWidth) - 2 * 16;
          if (vw < 700 && rc.width < cw * 0.6 && /pcard|listing__results|pdetail__main|svc__row|directory__row|hguide__row/.test(el.className)) out.push(`angosto: .${el.className.split(' ')[0]} ${Math.round(rc.width)}px de ${vw}`);
        }
        // palabras partidas en títulos (una palabra por línea)
        for (const h of main.querySelectorAll('h1, .pcard__title')) {
          const rc = h.getBoundingClientRect(); if (!rc.width) continue;
          const lh = parseFloat(getComputedStyle(h).lineHeight) || 20;
          const words = h.textContent.trim().split(/\s+/).length;
          if (rc.height / lh > Math.max(4, words * 0.7)) out.push(`título apilado: "${h.textContent.trim().slice(0, 30)}"`);
        }
        return [...new Set(out)].slice(0, 6);
      });
      if (r.length || errs.length) { problems++; console.log(`[${dn}] ${u}\n   ` + [...r, ...errs.splice(0)].join('\n   ')); }
    }
    await p.context().close();
  }
  console.log(problems ? `${problems} páginas con problemas` : 'SIN PROBLEMAS');
  await b.close();
})();
