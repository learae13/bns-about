/* Class Of — version C: department picture cards.
   - one borderless picture card per department, 2 rows of 5 on desktop
   - on each card: the department's head-count, big and white, above the department name
   - clicking a card opens a full-screen "department sheet" (native <dialog>):
       merlot background, big orange count + department title, then everyone in that
       department as a portrait cut into one of the brand mask shapes (same shapes as
       version A's hover portraits). Portraits pop in one after another; hovering one
       swaps its shape. Previous / next arrows step through departments; Esc or × closes.
   Data: class-of/people.js (`dept`). Card pictures are grey placeholders: set
   DEPT_IMAGES below to real files when they exist.
*/
(window.CLASS_OF_VERSIONS = window.CLASS_OF_VERSIONS || {}).c = {
  label: 'Department cards',
  mount(mount) {
    const data = window.CLASS_OF;
    if (!data || !mount) return;

    const PORTRAIT = 'class-of/portrait-placeholder.svg';
    const CARD_PLACEHOLDER = 'class-of/portrait-placeholder.svg';
    const DEPT_IMAGES = {
      // 'Design': 'assets/img/dept-design.jpg',
    };
    const MASKS = ['circle1', 'flower1', 'square1', 'cross1', 'flower2', 'square2', 'cross2', 'flower3', 'bars'];
    const DEPT_ORDER = ['Executive Leadership', 'Creative', 'Design', 'Motion & Animation', 'CG & VFX', 'Editorial',
      'Creative Technology', 'Production', 'Partnerships & Marketing', 'Operations'];
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const maskUrl = name => `url('class-of/masks/${name}.svg')`; // single quotes: used inside style="…"

    // ---------- data ----------
    const people = [...data.people].filter(p => p.name && p.role).sort((a, b) => a.name.localeCompare(b.name));
    const byDept = new Map();
    people.forEach(p => {
      const d = p.dept || 'Other';
      if (!byDept.has(d)) byDept.set(d, []);
      byDept.get(d).push(p);
    });
    const depts = [...byDept.keys()]
      .sort((a, b) => (DEPT_ORDER.indexOf(a) + 1 || 99) - (DEPT_ORDER.indexOf(b) + 1 || 99))
      .map(title => ({ title, people: byDept.get(title) }));

    // ---------- markup ----------
    mount.classList.add('coc', 'container', 'spacer-xl');
    mount.innerHTML = `
      <div class="section_head_root__HtR3K coc__head">
        <div class="section_head_line__TwGZz"></div>
        <div class="coc__head-row">
          <h2 class="section_head_title__TyGM4 coc__title">${esc(data.headline)}</h2>
          <p class="coc__summary typo-p3">${people.length} people, ${depts.length} departments</p>
        </div>
      </div>
      <ul class="coc__grid">
        ${depts.map((d, i) => `
          <li>
            <button type="button" class="coc__card" data-i="${i}" aria-haspopup="dialog">
              <span class="coc__card-img"><img alt="" loading="lazy" src="${esc(DEPT_IMAGES[d.title] || CARD_PLACEHOLDER)}"></span>
              <span class="coc__card-text">
                <span class="coc__count">${d.people.length}</span>
                <span class="coc__dept">${esc(d.title)}</span>
              </span>
            </button>
          </li>`).join('')}
      </ul>
      <dialog class="coc__sheet" aria-labelledby="coc-sheet-title">
        <div class="coc__sheet-inner container">
          <header class="coc__sheet-head">
            <div class="coc__sheet-heading">
              <span class="coc__sheet-count" aria-hidden="true"></span>
              <h3 class="coc__sheet-title" id="coc-sheet-title"></h3>
            </div>
            <div class="coc__sheet-nav">
              <button type="button" class="coc__nav" data-step="-1" aria-label="Previous department">
                <svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M1.86 13h23.16M13.6 1.3 1.93 12.97 13.6 24.64" stroke="currentColor" stroke-width="2"/></svg>
              </button>
              <button type="button" class="coc__nav" data-step="1" aria-label="Next department">
                <svg viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M24.14 13H.98M12.4 1.3 24.08 12.97 12.4 24.64" stroke="currentColor" stroke-width="2"/></svg>
              </button>
              <button type="button" class="coc__nav coc__close" aria-label="Close">
                <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2 2l28 28M30 2L2 30" stroke="currentColor" stroke-width="2" fill="none"/></svg>
              </button>
            </div>
          </header>
          <ul class="coc__people"></ul>
        </div>
      </dialog>`;

    const sheet = mount.querySelector('.coc__sheet');
    const sheetCount = sheet.querySelector('.coc__sheet-count');
    const sheetTitle = sheet.querySelector('.coc__sheet-title');
    const peopleList = sheet.querySelector('.coc__people');
    let currentDept = -1, opener = null, closing = null; // closing = the running close animation

    // ---------- sheet ----------
    function fill(i) {
      currentDept = (i + depts.length) % depts.length;
      const d = depts[currentDept];
      sheetCount.textContent = d.people.length;
      sheetTitle.textContent = d.title;
      sheetTitle.setAttribute('aria-label', `${d.title}, ${d.people.length} ${d.people.length === 1 ? 'person' : 'people'}`);
      peopleList.innerHTML = d.people.map((p, j) => {
        const mask = MASKS[(j + currentDept) % MASKS.length];
        return `
          <li class="coc__person" style="--i:${j}">
            <span class="coc__portrait" data-mask="${(j + currentDept) % MASKS.length}" style="-webkit-mask-image:${maskUrl(mask)};mask-image:${maskUrl(mask)}">
              <img alt="" src="${PORTRAIT}" style="object-position:${esc(p.focus || '50% 50%')}">
            </span>
            <span class="coc__name">${esc(p.name)}</span>
            <span class="coc__role">${esc(p.role)}</span>
          </li>`;
      }).join('');
      sheet.scrollTop = 0;
    }

    // hover / focus a portrait: switch to the next shape
    peopleList.addEventListener('pointerover', e => {
      const li = e.target.closest('.coc__person');
      if (!li || li.contains(e.relatedTarget)) return;
      const el = li.querySelector('.coc__portrait');
      const next = (Number(el.dataset.mask) + 1) % MASKS.length;
      el.dataset.mask = next;
      el.style.webkitMaskImage = el.style.maskImage = maskUrl(MASKS[next]);
    });

    function open(i, from) {
      // drop any close animation still running or held, or the sheet reopens invisible
      if (closing) { closing.onfinish = null; closing = null; }
      sheet.getAnimations().forEach(a => a.cancel());
      opener = from || null;
      fill(i);
      if (!sheet.open) sheet.showModal();
      document.documentElement.classList.add('coc-locked');
      if (!reduceMotion) sheet.animate(
        [{ transform: 'translateY(6%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' });
      sheet.querySelector('.coc__close').focus();
    }

    function close() {
      if (!sheet.open || closing) return;
      const done = () => {
        sheet.close();
        // remove the held "faded out" state so the next open starts clean
        closing?.cancel();
        closing = null;
        document.documentElement.classList.remove('coc-locked');
        opener?.focus();
      };
      if (reduceMotion) return done();
      closing = sheet.animate([{ opacity: 1 }, { transform: 'translateY(4%)', opacity: 0 }],
        { duration: 220, easing: 'cubic-bezier(.55,.085,.68,.53)', fill: 'forwards' });
      closing.onfinish = done;
    }

    function step(dir) {
      fill(currentDept + dir);
      opener = mount.querySelector(`.coc__card[data-i="${currentDept}"]`);
      if (!reduceMotion) peopleList.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    }

    mount.querySelectorAll('.coc__card').forEach(card =>
      card.addEventListener('click', () => open(Number(card.dataset.i), card)));
    sheet.querySelector('.coc__close').addEventListener('click', close);
    sheet.querySelectorAll('.coc__nav[data-step]').forEach(b =>
      b.addEventListener('click', () => step(Number(b.dataset.step))));
    sheet.addEventListener('cancel', e => { e.preventDefault(); close(); }); // Esc
    sheet.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  },
};
