#!/usr/bin/env python3
"""Compile a Coq library with the jscoq toolchain's coqc and install it
into the jscoq install tree, so it can be packaged into .coq-pkg
bundles and used to compile downstream volumes.

Usage: build-lib-jscoq.py SRCDIR LOGICALPATH [ROOT.v ...]

  SRCDIR       directory with the library's .v sources (subdirs ok)
  LOGICALPATH  e.g. ExtLib, mathcomp.ssreflect, QuickChick
  ROOT.v       optional root files (relative to SRCDIR): only their
               transitive closure is built; default = all .v files

Builds in ~/teaching/PLSschool/jscoq-libs/<TopLogical>/ (persistent),
sequentially (one coqc at a time, nice, -native-compiler no), then
copies .v/.vo/.glob into
  jscoq/_build/install/jscoq+64bit/lib/coq/user-contrib/<Logical/Path>.
Extra loadpath: the install tree's user-contrib (for cross-library
deps) via -R flags for already-installed libraries.
"""
import pathlib, re, subprocess, sys, os, shutil

HOME = pathlib.Path.home()
BASE = HOME / "teaching/PLSschool"
JS = BASE / "jscoq"
BIN = JS / "_build/install/jscoq+64bit/bin"
UC = JS / "_build/install/jscoq+64bit/lib/coq/user-contrib"
ENV = {**os.environ,
       'ROCQLIB': str(JS / "_build/install/jscoq+64bit/lib/coq")}

def main():
    src = pathlib.Path(sys.argv[1]).resolve()
    logical = sys.argv[2]
    roots = sys.argv[3:]
    top = logical.split('.')[0]
    work = BASE / "jscoq-libs" / top
    if not work.exists():
        shutil.copytree(src, work,
                        ignore=shutil.ignore_patterns(
                            '*.vo', '*.vos', '*.vok', '*.glob', '.coq-native'))
    os.chdir(work)

    # loadpath: this library + everything already installed
    flags = ['-R', '.', logical]
    for d in sorted(UC.iterdir()):
        if d.is_dir() and d.name != logical.split('.')[0]:
            flags += ['-Q', str(d), d.name]

    vfiles = [str(p.relative_to(work)) for p in work.rglob('*.v')]
    # coqdep aborts outright on files whose `Declare ML Module` it cannot
    # resolve (plugins not built yet) — drop such files and retry
    while True:
        r = subprocess.run([str(BIN / 'coqdep')] + flags + vfiles,
                           capture_output=True, text=True, env=ENV)
        if r.returncode == 0:
            break
        m = re.search(r'In file (\S+\.v)\b', r.stderr)
        if not m or m.group(1) not in vfiles:
            print("coqdep failed:", r.stderr[:400])
            sys.exit(1)
        print(f"coqdep: excluding {m.group(1)} ({r.stderr.splitlines()[1].strip() if len(r.stderr.splitlines())>1 else 'unresolvable'})",
              flush=True)
        vfiles.remove(m.group(1))
    deps = {}
    for line in r.stdout.splitlines():
        lhs = line.split(':')[0]
        if '.vo' not in lhs:
            continue
        tgt = lhs.split()[0][:-3]
        req = [m[:-3] for m in re.findall(r'(\S+\.vo)\b', line.split(':', 1)[1])]
        deps[tgt] = [x.lstrip('./') for x in req
                     if not x.startswith('/') and x.lstrip('./') != tgt]
    deps = {k.lstrip('./'): v for k, v in deps.items()}

    order, seen = [], set()
    def visit(n):
        if n in seen or n not in deps:
            return
        seen.add(n)
        for d in deps[n]:
            visit(d)
        order.append(n)
    for rt in (roots or sorted(deps)):
        visit(rt[:-2] if rt.endswith('.v') else rt)

    print(f"{len(order)} files to build under {work}", flush=True)
    for i, f in enumerate(order):
        if pathlib.Path(f + '.vo').exists() and \
           pathlib.Path(f + '.vo').stat().st_mtime > pathlib.Path(f + '.v').stat().st_mtime:
            continue
        r = subprocess.run(['nice', '-n', '19', str(BIN / 'coqc'), '-q',
                            '-native-compiler', 'no'] + flags + [f + '.v'],
                           capture_output=True, text=True, env=ENV)
        if r.returncode != 0:
            tail = [l for l in r.stderr.split('\n') if l][-8:]
            print(f"FAIL {f}:\n  " + "\n  ".join(tail), flush=True)
            sys.exit(1)
        print(f"[{i+1}/{len(order)}] {f}", flush=True)

    dest = UC / pathlib.Path(*logical.split('.'))
    dest.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in order:
        for ext in ('.v', '.vo', '.glob'):
            p = work / (f + ext)
            if p.exists():
                q = dest / (f + ext)
                q.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(p, q)
                n += 1
    print(f"installed {n} files into {dest}", flush=True)

main()
