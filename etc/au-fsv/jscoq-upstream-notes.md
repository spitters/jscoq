# jsCoq v9.0 branch — findings and proposed contributions

Prepared from porting jsCoq's `v9.0` branch (base `af06401`) to run Software
Foundations LF v7.0 on Rocq 9.0.0, fully locally. Local branch: `rocq9-fixes`
in `jscoq/` (8 commits, worktree clean). **Nothing has been pushed or filed.**

## Ready as PRs (committed on `rocq9-fixes`)

| Commit | Fix | Severity |
|---|---|---|
| `d805624` | Define `coq_vm_trap` + link `coq_perf.js` in the jsoo worker | worker dies on load without it |
| `7c9c02b` | `Coq.Init.Prelude` → `Corelib.Init.Prelude` (5 sites) | every non-empty doc fails (`Doc.create` anomaly) |
| `6ea47ae` | Implement `load_plugin` via the cma cache | nothing loads Ltac; every doc fails |
| `07a694a` | Forward Flèche `fileProgress`; shade checked region | feature restoration |
| `550fdad` | Surface workspace-init failure (was silently discarded) | diagnosability |
| `878431e` | Read `FailedRequire` from `data.failedRequire` (protocol drift from `extra`) | on-demand package load never triggers |
| `798edf6` | Reintroduce sentence stepping + toolbar up/down/to-cursor | dead UI, stale tooltips |
| `158bcfb` | Restore `backend/future.ts` (deleted in `021b566`, still imported) | CLI does not build |
| `1ff8041` | **local-only** `PKG_AFFILIATES` trim | see issue 3 below |

| `15d8840` | **Pump Fleche's incremental checker from the idle loop** | without it, a document loaded once is never checked — only continuous typing masks it |
| `163e39c` | Distribute checked-region shading across snippets | multi-snippet pages shade only block 1 |
| `3a2aa0b` | Version-stamp the worker URL | rebuilt workers invisible behind heuristic cache |
| `715e219` | Drop per-command queue-length log spam | log strip usability |
| `8bf6966` | Bullets (`-`/`+`/`*` runs) and focus braces as stepping stops | stepping skips the focused-goal state after a bullet |

Suggested PR order: `d805624`, `7c9c02b`, `6ea47ae`, `15d8840` make the branch
*run at all*; the rest are independent.

Additional upstream-worthy issues found while deploying (fixes live in our
deployment agent, `jscoq-agent-sf2.js`, but belong upstream):

- **`content_type` defaults to `'markdown'`** in CoqManager → document URI
  becomes `*.mv` → Fleche blanks everything outside ```coq fences. Any
  embedder that does not explicitly pass `'plain'` gets a validly-created,
  instantly-complete, empty document: no goals, no errors, nothing. Either
  default to `'plain'` or derive from the page type.
- **`Deprettify.REPLACES` lacks `∀`** (and `≥`) — coqdoc emits them, and the
  first `∀` kills the lexer with "Undefined token". One-line additions to
  `deprettify.ts`.
- **`getCursorOffset`/`setCursorOffset` are snippet-0-only** in the cm5
  container (fixed for cursor in `798edf6`, shading in `163e39c`) — anything
  else using them on multi-snippet pages is equally wrong.
- **`jscoq-agent.js` is stale on four axes**: imports the raw module tree
  (404s), calls the removed `JsCoq.load`, assumes DOMContentLoaded has not
  fired, and misses the affiliate `node_modules_path` on subdirectory pages.

Packaging lesson learned late: the `init` chunk must cover **all** of
Corelib, not just `Init`/`ssr`/`ssrmatching` as the legacy metadata did —
downstream libraries (e.g. Software Foundations) require `Corelib.Classes.*`,
and a missing Corelib module surfaces confusingly as "Error when parsing
.vo … Logical path was not found". Fixed in `coq-pkgs-full.json`.

## Issues worth filing (no patch, or patch needs upstream decisions)

1. **`jscoq.opam` needs `dune < 3.24`.** dune 3.24 removed `(using coq …)`;
   a fresh clone fails at configure. One-line constraint.
2. **No Rocq 9 stdlib.** Rocq 9.0 split the stdlib into `rocq-prover/stdlib`;
   the branch neither vendors nor packages it, `; (package rocq-stdlib)` is
   commented out, and `etc/pkg-metadata/stdlib-pkgs.json` is invalid JSON and
   pre-rename. We built it directly (`rocq makefile`, primitive-int/float/
   pstring subtree excluded — the `coerce-32bit` patch breaks `Uint63`'s
   proofs) and packaged it as one 28 MB `stdlib` chunk with the
   `micromega`/`zify`/`ring` plugins `lia` needs. Working metadata:
   `etc/pkg-metadata/coq-pkgs-full.json`. Upstreaming needs decisions:
   vendor-vs-opam, chunk split, and what to do about the excluded subtree.
3. **Missing affiliate packages disable the UI silently.** Every
   `PKG_AFFILIATES` entry is probed under `node_modules/@jscoq/...`; a missing
   one 404s ~9×, and since `handleMissingDeps` calls `disable()` before
   awaiting loads, any unresolved probe leaves navigation permanently off with
   no error anywhere. Probe failures should be non-fatal.
4. **Docs: build-order traps.** `make links` symlinks collide with dune rules
   on rebuild; `make jscoq` regenerates both the dune-managed `coq-pkgs`
   directory target and the install tree, deleting manually added packages —
   package after the last worker build. Neither is documented.

## Deployment-side artifacts (ours, not upstream)

- `jscoq-agent-sf2.js` (repo root) — the page agent that injects jsCoq into
  the SF book pages and terse decks, with readiness-proof boot (a module can
  finish loading after `DOMContentLoaded`; the stock listener then never
  fires) and the `software-foundations` bundle enabled.
- `rebuild-jscoq.sh`, `reinstall-jscoq-libs.sh`, `build-lib-jscoq.py` (this
  directory) — the build chain: worker, then stdlib/libs, then packages and
  frontend; paths are those of the build machine (see `README.md`).

## Full-SF status (2026-08-12, for FSV25)

All three course volumes now build, align, and verify end-to-end
(`fix-terse-decks.py` + `check-chapters.py`, generalized over
volume × format):

| Volume | terse decks | full book pages | jsCoq package |
|---|---|---|---|
| LF (21 ch) | 18/18 OK | 18/18 OK | `lf.coq-pkg` (all chapters) |
| PLF (24 ch) | 19/19 OK | 19/19 OK | `plf.coq-pkg` (new, 2 MB) |
| QC (9 ch) | 6/6 OK* | 6/6 OK* | none — see below |

\* QC verified with the *system* Rocq (`rocq-9` switch) + QuickChick
2.1.1; counts are code-bearing pages (Preface/Postscript/Bib are trivial
and also pass).

- **QuickChick version trap:** coq-quickchick 2.2.0 renamed the surface
  vernacular `Derive` → `QCDerive` (aftermath of QuickChick/QuickChick#388,
  which was motivated by the Equations id clash); the SF book still says
  `Derive`, so QC only builds against **2.1.1** — exactly the pin in the
  course Docker (`4ever2/au-fsv`). Keep 2.1.1 until the book catches up.
- **QC in jsCoq: engine problem SOLVED in principle** (2026-08-12; see
  `qc-purecoq/` and the section below). The hard blocker was never just
  the plugin: `QuickChick`/`Sample` extract to OCaml and shell out to
  `ocamlfind` at runtime, impossible in a browser — which is why even
  the historical `jscoq/addon-quickchick` (plugin built unpatched, 8.16
  era) left the SF QC volume "not available yet" upstream. QC pages
  currently still ship *static* (`NO_AGENT` in `fix-terse-decks.py`);
  students run QuickChick in Docker. Flipping them live needs the
  remaining engineering listed below.
- **Checker fix:** `check-chapters.py`'s hand-rolled extractor kept
  `hide_at` sticky after the first depth-0 `HIDEFROMHTML` block, leaking
  quiz-div code (which the browser's CSS selectors never see) into the
  compiled document — false FAILs on Lists/Logic.
- **Serving layout:** jscoq-root symlinks `lf`/`plf`/`qc` → full books,
  `terse` (LF), `plf-terse`, `qc-terse` → decks; `jscoq-agent-sf2.js`
  now preloads `plf` alongside `lf`.
- **Headless CLI still stalls:** `dist-cli/cli.cjs run` throws
  `this.coq.add is not a function` — the headless manager still speaks
  the pre-Flèche STM protocol; porting it is the natural next upstream
  contribution.

## Pure-Coq QuickChick — the path to QC in the browser (2026-08-12)

Proof of concept in `qc-purecoq/` (permanent; `apply-purecoq-patches.py`
re-derives it from pristine QuickChick 2.1.1 sources, idempotent).
Insight: QuickChick's whole test loop (generation, running, shrinking)
is already written *in Coq* (`Test.v`); only the PRNG and four test
parameters are axioms realized by extraction. Realize them in Coq and
`quickCheck prop : Result` becomes a closed computable term — no
extraction, no OCaml, browser-compatible.

The patches (all in the one script):
1. `RandomQC.v` — splitmix64 on `Z` for `RandomSeed`/`randomNext`/
   `randomSplit`/`randomR{Bool,Nat,Int,N}`; the Prop-level soundness
   specs stay axioms (extraction's OCaml realization never satisfied
   them literally either).
2. `Test.v` — `defNumTests` etc. as definitions (extraction defaults).
3. `Checker.v` — `printTestCase` also threads the shown counterexample
   through the failure `reason` (pure `trace` is the identity, so the
   string is otherwise lost).
4. `Local Opaque` guards in `Generators.v`/`SemChecker.v` so their
   proofs keep treating the PRNG abstractly; two `printTestCase`
   semantics lemmas re-proved via `mapTotalResult_idSize`; one
   meta-theory obligation (`qpUnsized`) left `Admitted` (TODO).

Measured (native `vm_compute`, `Demo.v`): false nat prop → counter-
example **6**, "Failed after 7 tests", 0.02 s; 500 tests of a true prop
0.7 s; `rev l = l` → **[1; 2]** after 1 shrink, 0.03 s.

**SHIPPED (2026-08-13).** All of the engineering below is done; QC's 6
code-bearing pages verify end-to-end in BOTH formats (terse decks and
full book) through the jscoq toolchain with every `QuickChick`/
`Sample`/`Derive` command actually executing (pure, `QC_PURE=1`
mirrors the browser path natively):

- **Toolchain build.** `build-lib-jscoq.py` compiles ExtLib (117
  files), **mathcomp 1.19 base** (ssreflect ssrfun ssrbool eqtype
  ssrnat seq div — 1.19 predates hierarchy-builder, dodging elpi
  entirely; mathcomp 2.x is UNBUILDABLE here: rocq-elpi's vo state
  hits "integer cannot be read back on 32-bit platform" under the
  32-bit-marshal toolchain) and the patched QuickChick theories into
  the install tree; `reinstall-jscoq-libs.sh` re-populates after
  `make jscoq`. SimpleIO and Mutation are cut from the pure build
  (extraction-side only).
- **Three pure-evaluation pathologies found & fixed** (all in
  `apply-purecoq-patches.py`):
  1. `RoseTrees.Lazy` is a plain record that extraction maps to OCaml
     `Lazy.t` — strict in-kernel evaluation therefore materializes the
     whole exponential shrink-candidate tree per test. Fixed by making
     `lazy` a *notation* that thunks under a binder (reduction does not
     go under lambdas). One knock-on: the `Extract Inductive` mlname
     must be quoted (`["lazy"]`).
  2. `State`'s label map (`FMapAVL.Make(StringOT)`) becomes
     uncomputable under `vm_compute` from the 5th insertion (even the
     spine's `List.length` OOMs). Replaced with a 20-line association
     list — the label map only ever holds a handful of keys.
  3. `defNumTests` lowered to 1000 in the pure build (in-kernel tests;
     the browser has no VM, cbv only).
  Plus output parity: the shrunk counterexample now rides in the
  `Failure`'s shown message (extraction printed it via `trace`
  callbacks), so pass/fail/counterexample/`collect` distribution
  tables all render exactly like extracted QuickChick.
- **Plugin.** quickchick 2.1.1's plugin builds with dune against the
  jscoq install tree (`OCAMLPATH`), both `.cmxs` (native coqc) and
  `.cma` (worker). `quickChick.mlg.cppo` patched: `define_and_run`
  dispatches to `run_in_coq` under js_of_ocaml (or `QC_PURE=1`) —
  reduce the already-built `show (quickCheck prop)` term in-kernel
  (vm_compute with cbv fallback for the trapped jsoo VM) and decode
  the Coq string. All run commands (`QuickChick`, `Sample`,
  `MutateCheck`…) funnel through this one point.
- **Worker** (commits `5e04cfb`, `a8d074b` on `rocq9-fixes`):
  `load_plugin` probes candidate archive names so
  `coq-quickchick.plugin` → `quickchick_plugin.cma`, and skips
  unpackaged plugins with a warning instead of failing the Require.
- **Packaging.** `quickchick.coq-pkg` (4.1 MB: QuickChick + ExtLib +
  mathcomp base + plugin cma + its mk-pkg-generated `.cma.js`) in the
  `coq` bundle; `qc.coq-pkg` (9 chapters from `qc-jscoq/`) in the
  `software-foundations` bundle; agent preloads
  `['init','stdlib','ltac2','quickchick','qc']` on QC pages
  (path-detected). `'qc'` removed from `NO_AGENT`; decks re-repaired.

Upstream-worthy: the pure-evaluation patch set (PRNG realization, lazy
notation, assoc label map, in-kernel run path) is a candidate
QuickChick contribution — a "PureQC" profile — and would let jsCoq
finally publish SF volume 4. The three pathologies are invisible under
extraction and bite ANY in-Coq evaluation of QuickChick (also e.g.
`Compute (quickCheck p)` natively), so they are of independent value.
