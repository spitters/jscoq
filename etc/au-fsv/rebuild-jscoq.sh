#!/bin/bash
# Canonical rebuild for the PERMANENT jsCoq tree (~/teaching/PLSschool/jscoq).
# Steps: worker build -> stdlib resync (make jscoq wipes the install tree) ->
# repackage coq bundle + LF -> refresh node_modules affiliate copy -> frontend.
set -o pipefail
D=~/teaching/PLSschool
JS=$D/jscoq
cd "$JS" || exit 1
eval "$(opam env --switch=jscoq+64bit --set-switch)"

echo "########## 1/4 worker ##########"
rm -f backend/jsoo/jscoq_worker.bc.js
make jscoq -j2 2>&1 | grep -iE "^Error|error]" | head -5
rc=${PIPESTATUS[0]}; echo "make exit=$rc"; [ $rc -eq 0 ] || exit 2
ln -sf ../../_build/jscoq+64bit/backend/jsoo/jscoq_worker.bc.js backend/jsoo/jscoq_worker.bc.js

echo "########## 2/4 stdlib + libs resync ##########"
# Stdlib + ExtLib + mathcomp(1.19 base) + QuickChick(pure-Coq) — all wiped
# from the install tree by `make jscoq`; workdirs make this copy-only.
"$D/reinstall-jscoq-libs.sh" || exit 2
# the QuickChick umbrella (Declare ML Module) is compiled separately:
UC=$JS/_build/install/jscoq+64bit/lib/coq/user-contrib
( cd "$D/jscoq-libs/QuickChick" && ROCQLIB=$JS/_build/install/jscoq+64bit/lib/coq \
  $JS/_build/install/jscoq+64bit/bin/coqc -q -native-compiler no -R . QuickChick \
  -Q "$UC/ExtLib" ExtLib -Q "$UC/mathcomp" mathcomp QuickChick.v 2>/dev/null && \
  cp QuickChick.v QuickChick.vo QuickChick.glob "$UC/QuickChick/" )

echo "########## 3/4 repackage ##########"
chmod u+w _build/jscoq+64bit/coq-pkgs _build/jscoq+64bit/coq-pkgs/* 2>/dev/null
( cd _build/jscoq+64bit && node "$JS/dist-pkg/mk-pkg.cjs" \
    "$JS/etc/pkg-metadata/coq-pkgs-full.json" \
    --rootdir "$JS/_build/install/jscoq+64bit/lib" --nostdlib ) 2>&1 | tail -4 || exit 3
cat > /tmp/sf-lf-perm.json <<JSON
{ "builddir": "$JS/_build/jscoq+64bit/coq-pkgs", "bundle": "software-foundations",
  "projects": { "lf":  { "lf-jscoq":  { "prefix": "LF" } },
                "plf": { "plf-jscoq": { "prefix": "PLF" } },
                "qc":  { "qc-jscoq":  { "prefix": "QC" } } } }
JSON
( cd "$D" && node "$JS/dist-pkg/mk-pkg.cjs" /tmp/sf-lf-perm.json --rootdir "$D" --nostdlib ) 2>&1 | tail -2 || exit 4
A=$JS/node_modules/@jscoq/software-foundations/coq-pkgs
mkdir -p "$A"
cp _build/jscoq+64bit/coq-pkgs/software-foundations.json "$A/"
cp _build/jscoq+64bit/coq-pkgs/lf.coq-pkg "$A/"
cp _build/jscoq+64bit/coq-pkgs/plf.coq-pkg "$A/"
cp _build/jscoq+64bit/coq-pkgs/qc.coq-pkg "$A/"

echo "########## 4/4 frontend ##########"
npm run esbuild 2>&1 | grep -cE " error"
echo "########## DONE ##########"
ls -la _build/jscoq+64bit/coq-pkgs/ | tail -7
