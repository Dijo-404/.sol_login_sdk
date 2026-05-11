#!/usr/bin/env bash
set -euo pipefail

# Compile every .circom file in this package to r1cs + wasm.
# Requires: circom 2.x (https://docs.circom.io/getting-started/installation/)

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$PKG_DIR/build"

if ! command -v circom >/dev/null 2>&1; then
  echo "error: circom is not installed. See https://docs.circom.io/getting-started/installation/" >&2
  exit 1
fi

mkdir -p "$BUILD_DIR"

if [ ! -d "$PKG_DIR/node_modules/circomlib" ]; then
  echo "Installing circomlib (workspace dep)..."
  (cd "$PKG_DIR" && pnpm install --filter @sol-login/circuits...)
fi

for circuit in "$PKG_DIR"/*.circom; do
  name="$(basename "$circuit" .circom)"
  echo "==> compiling $name"
  circom "$circuit" \
    --r1cs --wasm --sym \
    -l "$PKG_DIR/node_modules" \
    -o "$BUILD_DIR"

  # snarkjs/circom emits build/<name>_js/<name>.wasm — hoist it for runtime convenience
  if [ -f "$BUILD_DIR/${name}_js/${name}.wasm" ]; then
    cp "$BUILD_DIR/${name}_js/${name}.wasm" "$BUILD_DIR/${name}.wasm"
  fi
done

echo "Compiled artifacts written to $BUILD_DIR"
