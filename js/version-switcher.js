/* Prototype tool: A/B/C/D switcher for the Class Of section.
   Versions register themselves on window.CLASS_OF_VERSIONS as { label, mount(section) }.
   Each switch swaps in a fresh, empty <section> (dropping the old version's listeners)
   and mounts the chosen version into it. The choice is kept in the URL (?v=b), so a
   link opens straight to a version, and remembered in this browser.
   To add version C: create class-of-c/ registering CLASS_OF_VERSIONS.c, and link its
   CSS and JS in index.html. Its button lights up automatically. */
(function () {
  const versions = window.CLASS_OF_VERSIONS || {};
  const KEYS = ['a', 'b', 'c', 'd'];
  const STORE = 'bns-class-of-version';
  let section = document.querySelector('[data-class-of]');
  if (!section) return;

  const store = {
    get() { try { return localStorage.getItem(STORE); } catch { return null; } },
    set(v) { try { localStorage.setItem(STORE, v); } catch { /* private mode */ } },
  };
  const fromUrl = new URLSearchParams(location.search).get('v');
  let current = [fromUrl, store.get(), 'a'].find(v => v && versions[v]);

  // ---------- UI ----------
  const ui = document.createElement('div');
  ui.className = 'vswitch';
  ui.setAttribute('role', 'group');
  ui.setAttribute('aria-label', 'Class Of version');
  ui.innerHTML = `
    <span class="vswitch__label">Class Of</span>
    <div class="vswitch__buttons">
      ${KEYS.map(k => {
        const v = versions[k];
        return `<button type="button" class="vswitch__btn" data-v="${k}" ${v ? '' : 'disabled'}
          title="${v ? `${k.toUpperCase()}: ${v.label}` : `${k.toUpperCase()}: not built yet`}">${k.toUpperCase()}</button>`;
      }).join('')}
    </div>
    <span class="vswitch__name" aria-live="polite"></span>`;
  document.body.append(ui);
  const buttons = [...ui.querySelectorAll('.vswitch__btn')];
  const nameEl = ui.querySelector('.vswitch__name');

  buttons.forEach(b => b.addEventListener('click', () => {
    if (b.disabled || b.dataset.v === current) return;
    select(b.dataset.v, true);
  }));

  function select(key, fromClick) {
    current = key;
    const fresh = document.createElement('section');
    for (const { name, value } of section.attributes) {
      if (name !== 'class') fresh.setAttribute(name, value);
    }
    section.replaceWith(fresh);
    section = fresh;
    versions[key].mount(fresh);

    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === key)));
    nameEl.textContent = versions[key].label;
    store.set(key);
    const url = new URL(location.href);
    url.searchParams.set('v', key);
    history.replaceState(null, '', url);

    // bring the section into view when switching from elsewhere on the page
    if (fromClick) {
      const r = fresh.getBoundingClientRect();
      if (r.top > innerHeight * 0.75 || r.bottom < 120) {
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        scrollTo({ top: scrollY + r.top - 120, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
  }

  select(current, false);
})();
