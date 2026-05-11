#!/usr/bin/env bash
set -euo pipefail

# Groth16 trusted setup for every compiled circuit in this package.
# Produces:
#   build/<circuit>_final.zkey  — proving key (used by both prover and verifier)
#   build/<circuit>_vkey.json   — verification key (used by backend + on-chain verifier)
#
# Requires:
#   - snarkjs (installed as a workspace devDep)
#   - Compiled circuits in build/ (run scripts/compile.sh first)
#
# CI note: this performs a SINGLE contribution. For mainnet production, run a real
# multi-party ceremony (https://github.com/iden3/snarkjs#groth16) and replace the zkey.

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$PKG_DIR/build"
PTAU_FILE="$BUILD_DIR/pot14_final.ptau"
PTAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau"

SNARKJS="$(cd "$PKG_DIR" && pnpm exec which snarkjs 2>/dev/null || true)"
if [ -z "$SNARKJS" ]; then
  SNARKJS="pnpm --filter @sol-login/circuits exec snarkjs"
fi

if [ ! -f "$PTAU_FILE" ]; then
  echo "==> downloading Powers of Tau (pot14)"
  mkdir -p "$BUILD_DIR"
  curl -sSL "$PTAU_URL" -o "$PTAU_FILE"
fi

for r1cs in "$BUILD_DIR"/*.r1cs; do
  [ -e "$r1cs" ] || { echo "no .r1cs files in $BUILD_DIR; run scripts/compile.sh first" >&2; exit 1; }
  name="$(basename "$r1cs" .r1cs)"
  zkey0="$BUILD_DIR/${name}_0.zkey"
  zkey1="$BUILD_DIR/${name}_final.zkey"
  vkey="$BUILD_DIR/${name}_vkey.json"

  echo "==> ${name}: groth16 setup"
  $SNARKJS groth16 setup "$r1cs" "$PTAU_FILE" "$zkey0"

  echo "==> ${name}: contribute"
  echo "$(date +%s)-$(head -c 32 /dev/urandom | base64 || echo random)" | \
    $SNARKJS zkey contribute "$zkey0" "$zkey1" --name="sol-login-ci" -v

  echo "==> ${name}: export vkey"
  $SNARKJS zkey export verificationkey "$zkey1" "$vkey"

  rm -f "$zkey0"
done

echo "Trusted setup complete. Artifacts in $BUILD_DIR"
