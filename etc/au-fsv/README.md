# AU FSV deployment notes

This branch (`rocq9-fixes`) is the jsCoq tree that runs Rocq 9.0.0 in the
browser for the Aarhus University course *Formal Software Verification*
(https://spitters.github.io/fsv26/). It is published to satisfy
the AGPL source offer for the served build and as a staging ground for
upstream pull requests; `jscoq-upstream-notes.md` lists the changes and
their status.

- `../pkg-metadata/coq-pkgs-full.json` — package metadata including a Rocq 9
  Stdlib chunk.
- `../../jscoq-agent-sf2.js` — the page agent that injects jsCoq into the
  Software Foundations book pages and terse decks.
- `rebuild-jscoq.sh`, `reinstall-jscoq-libs.sh`, `build-lib-jscoq.py` — the
  build chain (worker → stdlib/libs → packages → frontend); paths are those
  of the build machine.
