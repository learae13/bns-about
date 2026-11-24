/* Class Of — version D: department mosaic.
   Like version C (same cards, same full-screen department sheet), but the cards form an
   irregular mosaic: each department's tile AREA is proportional to its head-count
   (a "squarified treemap"), so Creative (10 people) is five times the size of Editorial (2).
   - the mosaic fills one rectangle; its shape follows the screen (wide on desktop,
     tall on phones) and the layout recomputes whenever the section is resized
   - count and department text scale with each tile (container query units)
   Shared pieces (data, card contents, sheet) come from window.CLASS_OF_DEPTS in
   class-of-c/class-of-c.js, which must load first.
*/
(window.CLASS_OF_VERSIONS = window.CLASS_OF_VERSIONS || {}).d = {
  label: 'Department mosaic',
  mount(mount) {
    const data = window.CLASS_OF;
    const D = window.CLASS_OF_DEPTS;
    if (!data || !mount || !D) return;
    const { people, depts } = D.groups(data);

    // mosaic height as a share of its width, by screen width
    const shapeFor = w => (w < 768 ? 3 : w < 1024 ? .9 : .66);

    mount.classList.add('coc', 'cod', 'container', 'spacer-xl');
    mount.innerHTML = `
      ${D.head(data, people, depts)}
      <ul class="cod__mosaic">
        ${depts.map((d, i) => `
          <li class="cod__cell" data-cell="${i}">
            <button type="button" class="coc__card cod__tile" data-dept="${i}" aria-haspopup="dialog">${D.cardInner(d)}</button>
          </li>`).join('')}
      </ul>`;
    D.attachSheet(mount, depts);

    const mosaic = mount.querySelector('.cod__mosaic');
    const cells = [...mosaic.querySelectorAll('.cod__cell')];
    // count size follows head-count: √ so its visual weight tracks the tile's area
    const biggest = Math.max(...depts.map(d => d.people.length));

    // Tile orders to try. Areas always stay proportional to head-count; only the packing
    // order changes. Biggest-first is the classic order, the rest are fixed shuffles
    // (seeded, so the same screen width always gives the same mosaic).
    const sizeOf = i => depts[i].people.length;
    const biggestFirst = depts.map((d, i) => i).sort((a, b) => sizeOf(b) - sizeOf(a) || a - b);
    const orders = [biggestFirst];
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let n = 0; n < 80; n++) {
      const o = [...biggestFirst];
      for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
      orders.push(o);
    }

    const measure = document.createElement('canvas').getContext('2d');

    function layout() {
      const W = mosaic.clientWidth;
      if (!W) return;
      const gap = parseFloat(getComputedStyle(mosaic).columnGap) || 0;
      const H = Math.round(W * shapeFor(document.documentElement.clientWidth));
      mosaic.style.height = `${H}px`;

      // what each tile has to hold, at the current breakpoint's sizes
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const css = getComputedStyle(mount);
      const inset = parseFloat(css.getPropertyValue('--cod-inset')) * rem || 16;
      const maxCount = parseFloat(css.getPropertyValue('--cod-count-max')) * rem || 160;
      const labelStyle = getComputedStyle(cells[0].querySelector('.coc__dept'));
      const labelLH = parseFloat(labelStyle.lineHeight) || 24;
      measure.font = `${labelStyle.fontWeight} ${parseFloat(css.getPropertyValue('--cod-label')) * rem}px ${labelStyle.fontFamily}`;
      const needs = depts.map(d => ({
        word: Math.max(...d.title.split(/\s+/).map(w => measure.measureText(w).width)), // longest word
        line: measure.measureText(d.title).width,                                       // whole name on one line
        share: Math.sqrt(d.people.length / biggest),
        digits: String(d.people.length).length,
      }));
      // For a w × h tile: how short it falls of fitting its label (0 = fits), and the biggest
      // shared count scale it allows once the label and padding are taken out.
      const tileFit = (i, w, h) => {
        const n = needs[i], inner = w - 2 * inset;
        const lines = Math.max(1, Math.ceil(n.line / Math.max(1, inner)));
        const roomH = h - 2 * inset - lines * labelLH - 8;
        return {
          short: Math.max(0, n.word - inner) + Math.max(0, labelLH * 2 - roomH),
          scale: Math.min(roomH / .9, inner / (.62 * n.digits)) / n.share,
        };
      };

      // lay out in a box one gap larger, then shrink each tile by the gap: equal gutters, flush outer edges.
      // Pick the order where every label fits (or comes closest); among those, the one where the
      // counts overall get closest to their ideal sizes (ideal = √share × --cod-count-max).
      // Scored as a sum of logs, so every cramped tile counts, not just the worst one.
      let best = null, bestShort = Infinity, bestRatio = -Infinity, order = biggestFirst;
      orders.forEach(o => {
        const rects = squarify(o.map(sizeOf), W + gap, H + gap);
        let short = 0, ratio = 0;
        rects.forEach((r, k) => {
          const f = tileFit(o[k], r.w - gap, r.h - gap);
          short += f.short;
          ratio += Math.log(Math.max(.01, Math.min(1, f.scale / maxCount)));
        });
        if (short < bestShort - .5 || (Math.abs(short - bestShort) <= .5 && ratio > bestRatio)) {
          bestShort = short; bestRatio = ratio; best = rects; order = o;
        }
      });

      best.forEach((r, k) => {
        const i = order[k];
        const w = Math.max(0, r.w - gap), h = Math.max(0, r.h - gap);
        const cell = cells[i];
        Object.assign(cell.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${w}px`, height: `${h}px` });
        // each count: its ideal size, or as big as this tile allows if that's smaller.
        // Worked out from the tile's final size, not measured: tiles animate to their new size.
        const f = tileFit(i, w, h);
        const size = Math.min(needs[i].share * maxCount, f.scale * needs[i].share);
        cell.style.setProperty('--cod-count', `${Math.max(0, Math.floor(size))}px`);
      });
    }

    // squarified treemap (Bruls, Huizing & van Wijk): rows of tiles whose aspect ratios stay close to 1
    function squarify(values, w, h) {
      const total = values.reduce((a, b) => a + b, 0);
      const areas = values.map(v => (v / total) * w * h);
      const out = [];
      let x = 0, y = 0, row = [];
      const worst = (r, side) => {
        const s = r.reduce((a, b) => a + b, 0);
        return Math.max(...r.map(a => Math.max((side * side * a) / (s * s), (s * s) / (side * side * a))));
      };
      const place = () => {
        const s = row.reduce((a, b) => a + b, 0);
        if (w >= h) { // column on the left
          const cw = s / h;
          let yy = y;
          row.forEach(a => { out.push({ x, y: yy, w: cw, h: a / cw }); yy += a / cw; });
          x += cw; w -= cw;
        } else {      // row along the top
          const rh = s / w;
          let xx = x;
          row.forEach(a => { out.push({ x: xx, y, w: a / rh, h: rh }); xx += a / rh; });
          y += rh; h -= rh;
        }
        row = [];
      };
      areas.forEach(a => {
        const side = Math.min(w, h);
        if (row.length && worst([...row, a], side) > worst(row, side)) place();
        row.push(a);
      });
      if (row.length) place();
      return out;
    }

    layout();
    const ro = new ResizeObserver(() => {
      if (!mosaic.isConnected) return ro.disconnect(); // version switched away
      layout();
    });
    ro.observe(mosaic);
  },
};
