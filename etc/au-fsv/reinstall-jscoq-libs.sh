#!/bin/bash
# Repopulate the jscoq install tree after `make jscoq` (which wipes it):
# Stdlib resync + ExtLib + mathcomp(1.19 base) + QuickChick(pure-Coq).
# The build-lib-jscoq.py runs are incremental: compiled vos live in
# jscoq-libs/<Lib>/ workdirs, so this is copy-only unless sources changed.
set -e
D=~/teaching/PLSschool
JS=$D/jscoq

echo "== Stdlib resync =="
TH=$JS/_vendor+v9.0+64bit/stdlib/theories
DEST=$JS/_build/install/jscoq+64bit/lib/coq/user-contrib/Stdlib
mkdir -p "$DEST"
( cd "$TH" && find . \( -name '*.vo' -o -name '*.glob' -o -name '*.v' \) \
    -exec cp --parents {} "$DEST/" \; )

echo "== ExtLib =="
python3 $D/build-lib-jscoq.py ~/.opam/rocq-9/lib/coq/user-contrib/ExtLib ExtLib | tail -1

echo "== mathcomp 1.19 base =="
python3 $D/build-lib-jscoq.py $D/mathcomp1-src/mathcomp/ssreflect mathcomp.ssreflect \
    ssreflect.v ssrfun.v ssrbool.v eqtype.v ssrnat.v seq.v div.v | tail -1

echo "== QuickChick (pure-Coq, sans umbrella) =="
python3 $D/build-lib-jscoq.py $D/qc-purecoq QuickChick \
    Show.v RandomQC.v Sets.v Nat_util.v Producer.v Enumerators.v Generators.v \
    State.v Checker.v Test.v ExtractionQC.v Decidability.v Classes.v \
    Instances.v DependentClasses.v Typeclasses.v SemChecker.v | tail -1
echo "== done =="
