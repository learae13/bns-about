/* Class Of — vanilla rebuild of the live component (Set_Replicator_BlockAboutTeam).
   Behaviour matched to the production bundle:
   - people sorted by name; each word of "Name, Role" is its own button
   - hover (or tap) a person: after 200 ms their words turn white and a 325 px
     masked portrait appears near the cursor, scaling in (expo.out, .5 s; live adds a 1 s delay, removed here — see HOVER_WAIT)
   - leave: portrait scales out (power2.in, .125 s)
   - a random mask shape is picked each time a portrait opens
*/
// Registered as version A for the version switcher (js/version-switcher.js), which
// calls mount() with a fresh, empty <section> each time A is selected.
(window.CLASS_OF_VERSIONS = window.CLASS_OF_VERSIONS || {}).a = {
  label: 'Current (live)',
  mount(mount) {
  const data = window.CLASS_OF;
  if (!data || !mount) return;

  // Portraits are grey placeholders in this prototype; swap PORTRAIT for real files later.
  const PORTRAIT = 'class-of/portrait-placeholder.svg';
  const MASKS = ['bars', 'cross1', 'cross2', 'circle1', 'square1', 'square2', 'flower1', 'flower2', 'flower3'];
  const SIZE = 325, HALF = SIZE / 2;
  // Hover timing. Live site: 200 ms wait + 1000 ms animation delay (1.2 s total), which felt too slow.
  const HOVER_WAIT = 200;      // ms before a hovered name highlights (avoids flicker when sweeping)
  const PORTRAIT_DELAY = 0;    // extra ms before the shape starts scaling in
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const people = [...data.people]
    .filter(p => p.name && p.role)
    .sort((a, b) => (a.name > b.name ? 1 : -1));

  // ---------- markup ----------
  mount.classList.add('class-of', 'container', 'spacer-xl');
  mount.innerHTML = `
    <div class="section_head_root__HtR3K spacer-padding-l">
      <div class="section_head_line__TwGZz"></div>
      <span class="section_head_title__TyGM4"><span>${data.headline}</span></span>
    </div>
    <div class="default-grid">
      <div class="col-span-full class-of__list"></div>
      <div class="class-of__portrait" aria-hidden="true"><div class="class-of__portrait-mask"></div></div>
    </div>`;
  const list = mount.querySelector('.class-of__list');
  const portrait = mount.querySelector('.class-of__portrait');
  const maskEl = portrait.firstElementChild;

  people.forEach((p, i) => {
    const wrap = document.createElement('span');
    wrap.className = 'class-of__person';
    wrap.dataset.index = i;
    const nameWords = p.name.split(' ');
    nameWords.forEach((w, j) => wrap.append(word(`${w}${j === nameWords.length - 1 ? ',' : ''}`), ' '));
    p.role.split(' ').forEach(w => wrap.append(word(w), ' '));
    const sep = document.createElement('span');
    sep.className = 'class-of__sep typo-h3';
    sep.textContent = '• ';
    wrap.append(sep);
    wrap.addEventListener('mouseenter', e => enter(e, i));
    wrap.addEventListener('mouseleave', leave);
    wrap.addEventListener('click', e => enter(e, i));
    wrap.addEventListener('focusin', e => enter(e, i));
    wrap.addEventListener('focusout', e => { if (!wrap.contains(e.relatedTarget)) leave(); });
    list.append(wrap);
  });

  function word(text) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'class-of__word typo-h3';
    b.textContent = text;
    return b;
  }

  // ---------- portrait ----------
  function setImage(p) {
    maskEl.innerHTML = '';
    if (!p.file) return false;
    const mask = MASKS[Math.floor(Math.random() * (MASKS.length - 1))]; // same range as live
    const url = `url("class-of/masks/${mask}.svg")`;
    maskEl.style.webkitMaskImage = url;
    maskEl.style.maskImage = url;
    const img = new Image();
    img.alt = '';
    img.src = PORTRAIT;
    maskEl.append(img);
    return true;
  }

  let timer = null, current = -1, anim = null;

  function enter(e, i) {
    if (i === current) return;
    clearTimeout(timer);
    const rootRect = mount.getBoundingClientRect();
    const targetRect = (e.target.closest('.class-of__word') || e.currentTarget).getBoundingClientRect();
    const clientX = e.clientX ?? targetRect.left + targetRect.width / 2;
    const clientY = e.clientY ?? targetRect.top;
    // live logic: clamp horizontally inside the viewport, open below the line
    // near the top of the screen, otherwise above it
    const vx = clientX < HALF ? 0 : clientX > innerWidth - HALF ? innerWidth - SIZE : clientX - HALF;
    const y = targetRect.top - rootRect.top - (clientY < 385 ? -60 : 365);
    portrait.style.left = `${vx - rootRect.left}px`;
    portrait.style.top = `${y}px`;

    timer = setTimeout(() => {
      highlight(current, false);
      current = i;
      highlight(i, true);
      if (setImage(people[i])) {
        anim?.cancel();
        anim = portrait.animate(
          [{ transform: 'scale(.01)' }, { transform: 'scale(1)' }],
          reduceMotion
            ? { duration: 1, fill: 'forwards' }
            : { duration: 500, delay: PORTRAIT_DELAY, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }
        );
      } else {
        anim?.cancel();
        portrait.style.transform = 'scale(0)';
      }
    }, HOVER_WAIT);
  }

  function leave() {
    clearTimeout(timer);
    highlight(current, false);
    current = -1;
    anim?.cancel();
    anim = portrait.animate(
      [{ transform: getComputedStyle(portrait).transform }, { transform: 'scale(0)' }],
      { duration: reduceMotion ? 1 : 125, easing: 'cubic-bezier(.55,.085,.68,.53)', fill: 'forwards' }
    );
  }

  function highlight(i, on) {
    if (i < 0) return;
    list.children[i]?.querySelectorAll('.class-of__word').forEach(w => w.classList.toggle('is-hovered', on));
  }

  }
};
