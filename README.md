# BNS About page — Class Of redesign prototype

Static copy of brandnewschool.com/about (snapshot, Nov 2026) for prototyping
the **Class Of** section. No framework, no build step, no tracking.

## Run locally
Use a local server (mask images don't load from file://):

    npx serve .          # or: python3 -m http.server

Type: Neue Haas Grotesk Display Pro loads from the copy installed on this Mac
(assets/fonts/fonts.css, via local()). Without it, Helvetica Neue is used.

All images are grey placeholders (same dimensions as the originals, so the
layout matches). Nothing loads from BNS servers.

## Deploy
Drag this folder onto https://app.netlify.com/drop, or connect a repo
(publish dir `.`, no build command). Pages are served `noindex`.

## Structure
    index.html            the page; Class Of is a mount point marked with comments
    css/site.css          the live site's CSS (unchanged except fonts)
    css/overrides.css     replaces behaviour the site's JS used to provide
    js/site.js            nav show/hide, quote crossfade, marquee, inert links
    class-of/
      people.js           roster data (63 people)
      class-of.css        section styles; size/colour tokens at the top
      class-of.js         rendering + hover portrait behaviour (matches live)
      masks/              portrait mask shapes (stand-ins until fetched)
      portrait-placeholder.svg   grey portrait used on hover
    assets/img            grey placeholders, one per original image, same size
    assets/fonts          drop licensed Neue Haas files here (see README)

## Versions (A/B/C/D switcher)
A pill in the top-right corner switches the Class Of section between versions.
The choice is kept in the URL, so `?v=b` links straight to B.

    class-of/      A: current live design (hover portraits)
    class-of-b/    B: sortable roster (Alphabetical / Department / Studio / Leadership);
                      clicking a name opens a profile card with the Leadership card motion
    class-of-c/    C: department picture cards (head-count + department on each). Clicking one
                      opens a full-screen sheet of that department's people as masked portraits;
                      ← → step through departments. Card pictures: DEPT_IMAGES in class-of-c.js
    js/version-switcher.js, css/version-switcher.css   the switcher itself

To add C: copy `class-of-b/` to `class-of-c/`, change its registration line to
`CLASS_OF_VERSIONS.c = {...}`, and link its CSS and JS in index.html. Its
button turns on by itself. D works the same way.

Roster fields used by B (in class-of/people.js): `dept` is derived from job titles
(check it), `studio` is a PLACEHOLDER assigned in rotation, and `leadership` marks
people who also appear in the Leadership section.

## Leadership cards
Clicking a card opens it full width with the bio, as on the live site (js/site.js).
Other cards stay in their columns and move below it. Close with × or Esc.

## Notes
- Type falls back to Helvetica Neue (Mac/iOS) or Inter Tight (elsewhere).
- Hero video, leadership portraits, client logos, award icons and the
  Join Us flag animation are grey placeholders. Small UI control icons
  (play/pause, close) are kept.
- Services accordion doesn't expand (buttons are inert).
