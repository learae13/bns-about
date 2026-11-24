/* Class Of — version B: sortable roster with expanding profile cards.
   Based on the "Team" mockups (Alphabetical / Department / Studio / Leadership).
   - roster lines ("Name, Title") use typo-p2, the style of names and titles on
     brandnewschool.com/contact, so they stay on one line
   - sort tabs regroup the roster; groups are balanced into two columns (one on mobile)
   - clicking a name opens it in place as a white card: the card grows (.4s,
     cubic-bezier(.25,1,.5,1)), the image fades in, then name, title, department,
     location and links rise in beneath it, with the bio fading in beside them.
     One card is open at a time.
   Data: class-of/people.js (`departments`, `studio`, `leadership`). Departments are the
   official ones; a person with two appears under both. Executives (empty `departments`)
   are shown in the Leadership section above, so they're left out here. Bios come from
   the Leadership section's text when the person appears there; others get a placeholder.
*/
(window.CLASS_OF_VERSIONS = window.CLASS_OF_VERSIONS || {}).b = {
  label: 'Sortable roster',
  mount(mount) {
    const data = window.CLASS_OF;
    if (!data || !mount) return;

    const PORTRAIT = 'class-of/portrait-placeholder.svg';
    const EASE = 'cubic-bezier(.25,1,.5,1)';
    const DUR = 400;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // official departments, in BNS order
    const DEPT_ORDER = ['Brand & Strategy', 'Creative & Design', 'Motion & Content', 'Creative Tech',
      'Project Management', 'Marketing & Partnerships', 'Operations'];
    const STUDIO_ORDER = ['Los Angeles', 'New York', 'London', 'Remote'];
    const SORTS = [
      { key: 'alpha', label: 'Alphabetical' },
      { key: 'dept', label: 'Department' },
      { key: 'studio', label: 'Studio' },
      { key: 'leadership', label: 'Leadership' },
    ];

    // Bios, "Additional information" links and order from the Leadership section on this page
    const leaderBios = new Map();
    const leaderLinks = new Map();
    const leaderOrder = [];
    document.querySelectorAll('.about_leadership_card__3IgOu').forEach(card => {
      const name = card.querySelector('.about_leadership_nameAndRole__8Y_Hs > div')?.textContent.trim();
      if (!name) return;
      leaderOrder.push(name);
      leaderBios.set(name, [...card.querySelectorAll('.about_leadership_text__3dunq p')].map(p => p.textContent.trim()).filter(Boolean));
      leaderLinks.set(name, [...card.querySelectorAll('.about_leadership_additionalInfo__h7oaE a')]
        .map(a => ({ label: a.textContent.trim(), href: a.getAttribute('href') || '#' }))
        .filter(l => l.label));
    });
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // Same arrow as the live site's arrow links
    const ARROW = '<svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M24.1404 13H.975471M12.4056 1.29786 24.075 12.9672 12.4056 24.6366" stroke="currentColor" stroke-width="2"/></svg>';

    // executives (no department) already have cards in the Leadership section above
    const people = [...data.people]
      .filter(p => p.name && p.role && !(Array.isArray(p.departments) && p.departments.length === 0))
      .sort((a, b) => a.name.localeCompare(b.name));
    const deptsOf = p => (p.departments && p.departments.length ? p.departments : ['Other']);
    let uid = 0; // a person can be listed twice (two departments), so card ids get a counter

    // ---------- markup ----------
    mount.classList.add('cob', 'container', 'spacer-xl');
    mount.innerHTML = `
      <div class="section_head_root__HtR3K cob__head">
        <div class="section_head_line__TwGZz"></div>
        <div class="cob__head-row">
          <h2 class="section_head_title__TyGM4 cob__title">${data.headline}</h2>
          <div class="cob__sorts" role="tablist" aria-label="Sort the roster">
            ${SORTS.map(s => `<button type="button" role="tab" class="cob__sort typo-p3" data-sort="${s.key}">${s.label}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="cob__list default-grid" role="tabpanel"></div>`;
    const list = mount.querySelector('.cob__list');
    const sortButtons = [...mount.querySelectorAll('.cob__sort')];

    let sort = 'alpha';
    let openItem = null;

    sortButtons.forEach(b => b.addEventListener('click', () => setSort(b.dataset.sort)));
    mount.querySelector('.cob__sorts').addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = sortButtons.indexOf(document.activeElement);
      if (i < 0) return;
      const next = sortButtons[(i + (e.key === 'ArrowRight' ? 1 : sortButtons.length - 1)) % sortButtons.length];
      next.focus();
      setSort(next.dataset.sort);
    });

    function groupsFor(key) {
      // fn returns one group key, or several (the person is listed in each)
      const by = (fn, order) => {
        const map = new Map();
        people.forEach(p => [].concat(fn(p)).forEach(k => { if (!map.has(k)) map.set(k, []); map.get(k).push(p); }));
        const keys = [...map.keys()];
        if (order) keys.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
        return keys.map(k => ({ title: k, people: map.get(k) }));
      };
      if (key === 'alpha') return by(p => p.name[0].toUpperCase());
      if (key === 'dept') return by(deptsOf, DEPT_ORDER);
      if (key === 'studio') return by(p => p.studio || 'Other', STUDIO_ORDER);
      const leaders = people.filter(p => p.leadership)
        .sort((a, b) => (leaderOrder.indexOf(a.name) + 1 || 99) - (leaderOrder.indexOf(b.name) + 1 || 99));
      return [{ title: 'Leadership', people: leaders }];
    }

    // Leadership reads as one long column; the others split in two
    function columnsFor(key, groups) {
      // Studio: first two studios side by side (Los Angeles | New York), any others continue on the left
      if (key === 'studio' && groups.length > 1) {
        return [groups.filter((_, i) => i !== 1), [groups[1]]];
      }
      const twoCols = key === 'alpha' || key === 'dept';
      if (!twoCols) return [groups];
      const sizes = groups.map(g => g.people.length + 2); // title + names + gap
      const total = sizes.reduce((a, b) => a + b, 0);
      let best = 1, bestDiff = Infinity, run = 0;
      for (let i = 0; i < groups.length - 1; i++) {
        run += sizes[i];
        const diff = Math.max(run, total - run);
        if (diff < bestDiff) { bestDiff = diff; best = i + 1; }
      }
      return [groups.slice(0, best), groups.slice(best)];
    }

    function setSort(key, first) {
      sort = key;
      sortButtons.forEach(b => {
        const on = b.dataset.sort === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
      });
      openItem = null;
      const groups = groupsFor(key);
      const cols = columnsFor(key, groups);
      list.innerHTML = '';
      cols.forEach(colGroups => {
        const col = document.createElement('div');
        col.className = `cob__col ${cols.length === 1 ? 'cob__col--single' : ''}`;
        colGroups.forEach(g => col.append(renderGroup(g)));
        list.append(col);
      });
      if (!first && !reduceMotion) list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    }

    function renderGroup(g) {
      const el = document.createElement('div');
      el.className = 'cob__group';
      el.innerHTML = `<h3 class="cob__group-title typo-h3">${g.title}</h3><ul class="cob__people"></ul>`;
      const ul = el.querySelector('ul');
      g.people.forEach(p => ul.append(renderPerson(p)));
      return el;
    }

    function renderPerson(p) {
      const li = document.createElement('li');
      li.className = 'cob__person';
      const id = `cob-${p.name.toLowerCase().replace(/[^a-z]+/g, '-')}-${++uid}`;
      const bio = leaderBios.get(p.name);
      // links: optional `links: [{label, href}]` in people.js, else the person's Leadership card links
      const links = p.links || leaderLinks.get(p.name) || [];
      li.innerHTML = `
        <button type="button" class="cob__line typo-p2" aria-expanded="false" aria-controls="${id}">${esc(p.name)}, ${esc(p.role)}</button>
        <div class="cob__card" id="${id}" role="region" aria-label="${esc(p.name)}">
          <button type="button" class="cob__close" aria-label="Close ${esc(p.name)}">
            <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2 2l28 28M30 2L2 30" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </button>
          <div class="cob__card-body">
            <div class="cob__side">
              <div class="cob__portrait"><img alt="" src="${PORTRAIT}" style="object-position:${esc(p.focus || '50% 50%')}"></div>
              <div class="cob__details">
                <p class="cob__card-head">
                  <span class="cob__card-name">${esc(p.name)}</span>
                  <span class="cob__card-role">${esc(p.role)}</span>
                </p>
                <dl class="cob__meta">
                  <div><dt>Department</dt><dd>${esc(deptsOf(p).join(', '))}</dd></div>
                  <div><dt>Location</dt><dd>${esc(p.studio || '—')}</dd></div>
                </dl>
                ${links.length ? `
                <div class="cob__links">
                  <p class="cob__links-title">Additional information</p>
                  <ul>${links.map(l => `<li><a class="cob__link" href="${esc(l.href)}">${esc(l.label)}${ARROW}</a></li>`).join('')}</ul>
                </div>` : ''}
              </div>
            </div>
            <div class="cob__bio">
              ${bio && bio.length
                ? bio.map(t => `<p>${t}</p>`).join('')
                : `<p class="cob__bio-placeholder">Bio to come. Placeholder copy for the prototype.</p>`}
            </div>
          </div>
        </div>`;
      li.querySelector('.cob__line').addEventListener('click', () => toggle(li));
      li.querySelector('.cob__close').addEventListener('click', () => close(li, true));
      li.addEventListener('keydown', e => { if (e.key === 'Escape' && li === openItem) close(li, true); });
      return li;
    }

    // ---------- open / close ----------
    function toggle(li) {
      if (li === openItem) return close(li, true);
      // a card closing above this one, in the same column, pulls it up by however much it shrinks
      let shift = 0;
      if (openItem) {
        const prev = openItem;
        const shrink = close(prev);
        const above = prev.compareDocumentPosition(li) & Node.DOCUMENT_POSITION_FOLLOWING;
        if (above && prev.closest('.cob__col') === li.closest('.cob__col')) shift = shrink;
      }
      open(li, shift);
    }

    function animateHeight(li, from, to, done) {
      li.getAnimations().forEach(a => a.cancel());
      if (reduceMotion) { done?.(); return; }
      const a = li.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: DUR, easing: EASE });
      a.onfinish = () => done?.();
    }

    function open(li, shift = 0) {
      const from = li.offsetHeight;
      li.classList.add('is-open');
      li.querySelector('.cob__line').setAttribute('aria-expanded', 'true');
      const card = li.querySelector('.cob__card');
      const to = li.offsetHeight;
      openItem = li;
      // card grows; image fades in, details rise in under it, bio fades in (CSS, on .is-revealed)
      requestAnimationFrame(() => card.classList.add('is-revealed'));
      animateHeight(li, from, to);
      // keep the card in view: work out where its top will be once a card closing above it has
      // finished shrinking (`shift`, from toggle), then scroll so it sits below the nav
      const cardRect = card.getBoundingClientRect();
      const top = cardRect.top - shift;
      const h = to - (cardRect.top - li.getBoundingClientRect().top); // card + its bottom margin
      if (top + h > innerHeight - 24 || top < 80) {
        const target = scrollY + top - Math.max(120, (innerHeight - h) / 2);
        scrollTo({ top: Math.max(0, target), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }

    function close(li, refocus) {
      const card = li.querySelector('.cob__card');
      const line = li.querySelector('.cob__line');
      const from = li.offsetHeight;
      card.classList.remove('is-revealed');
      li.classList.remove('is-open');
      const to = li.offsetHeight;
      li.classList.add('is-closing');
      line.setAttribute('aria-expanded', 'false');
      if (openItem === li) openItem = null;
      animateHeight(li, from, to, () => {
        li.classList.remove('is-closing');
        if (refocus) line.focus({ preventScroll: true });
      });
      return from - to; // how much it shrinks
    }

    setSort('alpha', true);
  },
};
