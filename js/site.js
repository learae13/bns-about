/* Minimal stand-ins for the live site's runtime. Links and buttons outside
   the Class Of section are intentionally inert for the prototype. */
(function () {
  // Inert links/buttons (Class Of handles its own)
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a) e.preventDefault();
  });

  // Nav: show at top / on scroll up, hide on scroll down
  const nav = document.querySelector('.nav_desktop_nav__IiIZw');
  if (nav) {
    const HIDDEN = 'nav_desktop_navHidden__tsvVq';
    let last = scrollY;
    nav.classList.remove(HIDDEN);
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y < 80 || y < last) nav.classList.remove(HIDDEN);
      else if (y > last + 4) nav.classList.add(HIDDEN);
      last = y;
    }, { passive: true });
  }

  // Leadership: absolute card layout + click-to-expand, rebuilt from the live behaviour.
  // - cards sit in 3 / 2 / 1 columns (>=1024 / >=768 / smaller), each locked to portrait height
  // - clicking a card makes it full width at the top of its row; the portrait slides down
  //   to reveal name and role, the bio fades in on the right, and a close button appears
  // - the other cards keep their column and stack below the open card
  // Transitions (.4s, cubic-bezier(.25,1,.5,1)) come from the site's own CSS.
  const leadRoot = document.querySelector('.about_leadership_cards__YAj24');
  if (leadRoot) {
    const EXPANDED = 'about_leadership_cardExpanded__sNVYQ';
    const cards = [...leadRoot.querySelectorAll('.about_leadership_card__3IgOu')];
    const part = (card, name) => card.querySelector(`[class*="about_leadership_${name}__"]`);
    let open = -1;

    const layout = () => {
      const vw = document.documentElement.clientWidth;
      const cols = vw >= 1024 ? 3 : vw >= 768 ? 2 : 1;
      const fullW = leadRoot.clientWidth;
      const colW = fullW / cols;
      const cardPad = parseFloat(getComputedStyle(cards[0]).paddingLeft);
      const innerPad = parseFloat(getComputedStyle(part(cards[0], 'inner')).paddingLeft);
      const contentW = colW - 2 * cardPad - 2 * innerPad;
      const cardH = contentW / 0.7784431138 + 2 * innerPad + 2 * cardPad; // portrait aspect from site.css

      cards.forEach((card, i) => {
        ['nameAndRole', 'imageContainer'].forEach(n => { const el = part(card, n); if (el) el.style.width = `${contentW}px`; });
        const bio = part(card, 'bio');
        if (bio) {
          if (cols === 1) { bio.style.width = `${contentW}px`; bio.style.marginLeft = '0'; }
          else {
            const room = fullW - 2 * cardPad - 2 * innerPad - contentW - 2 * innerPad - 8 * 10; // keep clear of the close button
            bio.style.width = `${Math.max(240, Math.min(658.24, room))}px`;
            bio.style.marginLeft = `${2 * innerPad}px`;
          }
        }
      });

      // how far the portrait slides down (hover peek + open card): just past this card's
      // name and role, plus the card's inner padding (same 30px gap as Class Of B's cards).
      // The live site uses a fixed 14/16/22rem, which covers roles that wrap to a second line.
      cards.forEach(card => {
        const head = part(card, 'nameAndRole');
        if (head) card.style.setProperty('--lead-reveal', `${head.offsetHeight + innerPad}px`);
      });

      // height of the open card = its natural content height
      let openH = 0;
      if (open >= 0) {
        const inner = part(cards[open], 'inner');
        inner.style.height = 'auto';
        openH = inner.offsetHeight + 2 * cardPad;
        inner.style.height = '';
      }

      const openRow = open >= 0 ? Math.floor(open / cols) : Infinity;
      const colTops = Array(cols).fill(0);
      cards.forEach((card, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        let left = col * colW, top, w = colW, h = cardH;
        if (i === open) { left = 0; top = openRow * cardH; w = fullW; h = openH; }
        else if (row < openRow) top = row * cardH;
        else top = openRow * cardH + openH + colTops[col]++ * cardH;
        Object.assign(card.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` });
      });
      const rows = Math.ceil(cards.length / cols);
      const total = open >= 0
        ? openRow * cardH + openH + Math.max(...colTops) * cardH
        : rows * cardH;
      leadRoot.style.height = `${total}px`;
    };

    const setOpen = i => {
      if (open >= 0) {
        cards[open].classList.remove(EXPANDED);
        part(cards[open], 'inner').setAttribute('aria-expanded', 'false');
      }
      open = i;
      if (open >= 0) {
        cards[open].classList.add(EXPANDED);
        part(cards[open], 'inner').setAttribute('aria-expanded', 'true');
      }
      layout();
      // keep the opened card's top in view (matters most in the 1-column layout)
      if (open >= 0) {
        const top = parseFloat(cards[open].style.top) + leadRoot.getBoundingClientRect().top;
        if (top < 80 || top > innerHeight * 0.6) {
          scrollTo({ top: scrollY + top - 120, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
      }
    };

    cards.forEach((card, i) => {
      const inner = part(card, 'inner');
      const name = card.querySelector('.about_leadership_nameAndRole__8Y_Hs > div')?.textContent.trim();
      inner.setAttribute('role', 'button');
      inner.setAttribute('tabindex', '0');
      inner.setAttribute('aria-expanded', 'false');
      if (name) inner.setAttribute('aria-label', `${name}: show bio`);
      inner.addEventListener('click', e => {
        if (e.target.closest('.about_leadership_x__2rpEs')) return;
        if (open !== i) setOpen(i);
      });
      inner.addEventListener('keydown', e => {
        if (e.target !== inner) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(open === i ? -1 : i); }
        if (e.key === 'Escape' && open === i) setOpen(-1);
      });
      const x = part(card, 'x');
      if (x) {
        x.setAttribute('aria-label', 'Close bio');
        x.addEventListener('click', e => { e.stopPropagation(); setOpen(-1); inner.focus({ preventScroll: true }); });
      }
    });

    layout();
    addEventListener('resize', layout);
    addEventListener('load', layout);
  }

  // Card masks (hero media, Join Us): full-bleed with square corners, shrinking to the
  // container width with 2vw corners as they scroll up. Ranges are the element's top
  // edge as a fraction of viewport height, measured from the live page.
  const masks = [...document.querySelectorAll('.card_mask_root__qqQj9')];
  const RANGES = [[0.9, 0.38], [0.56, 0.08]];
  const container = document.querySelector('.container');
  const ease = t => t * t * (3 - 2 * t);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let maskQueued = false;
  const updateMasks = () => {
    maskQueued = false;
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    const pad = container ? parseFloat(getComputedStyle(container).paddingLeft) : 0;
    const target = vw - pad * 2;
    masks.forEach((el, i) => {
      const [from, to] = RANGES[Math.min(i, RANGES.length - 1)];
      const top = el.getBoundingClientRect().top / vh;
      const p = reduced ? 1 : ease(Math.min(1, Math.max(0, (from - top) / (from - to))));
      el.style.width = `${vw - (vw - target) * p}px`;
      el.style.borderRadius = `${2 * p}vw`;
    });
  };
  const queueMasks = () => { if (!maskQueued) { maskQueued = true; requestAnimationFrame(updateMasks); } };
  updateMasks();
  addEventListener('scroll', queueMasks, { passive: true });
  addEventListener('resize', queueMasks);

  // Quotes: autoplay crossfade, 6 s like the live Swiper config
  document.querySelectorAll('.slider_next_overlay_root__Ipnd6').forEach(root => {
    const slides = [...root.querySelectorAll('.swiper-slide')];
    if (!slides.length) return;
    let i = 0;
    slides[0].classList.add('is-active');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setInterval(() => {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 6000);
  });

  // Marquee: shift by exactly one repeated group so the loop is seamless
  document.querySelectorAll('.marquee-text_marqueeTrack__2qvS8').forEach(track => {
    const groups = track.children;
    if (groups.length < 2) return;
    const set = () => {
      const w = groups[0].getBoundingClientRect().width;
      track.style.setProperty('--marquee-shift', `${w}px`);
      track.style.setProperty('--marquee-duration', `${Math.max(10, w / 80)}s`);
    };
    set();
    addEventListener('resize', set);
  });
})();
