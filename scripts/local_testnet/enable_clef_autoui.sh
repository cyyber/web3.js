#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_SCRIPTS_DIR="$( cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd )"

ACCOUNTS_FILE_DEFAULT="$REPO_SCRIPTS_DIR/accounts.json"

ENCLAVE_NAME=${ENCLAVE_NAME:-local-testnet}
CLEF_SERVICE_NAME=${CLEF_SERVICE_NAME:-signer-clef}
CLEF_KEY_PASSWORD=${CLEF_KEY_PASSWORD:-passwordpassword}
ACCOUNTS_FILE=${ACCOUNTS_FILE:-$ACCOUNTS_FILE_DEFAULT}

while getopts "e:s:p:f:h" flag; do
  case "${flag}" in
    e) ENCLAVE_NAME=${OPTARG};;
    s) CLEF_SERVICE_NAME=${OPTARG};;
    p) CLEF_KEY_PASSWORD=${OPTARG};;
    f) ACCOUNTS_FILE=${OPTARG};;
    h)
      echo "Enable non-interactive tx signing for clef by running it behind scripts/local_testnet/clef_autoui."
      echo
      echo "usage: $0 [options]"
      echo
      echo "options:"
      echo "  -e  enclave name              default: $ENCLAVE_NAME"
      echo "  -s  clef service name         default: $CLEF_SERVICE_NAME"
      echo "  -p  clef key password         default: (from \$CLEF_KEY_PASSWORD or 'passwordpassword')"
      echo "  -f  accounts.json path        default: $ACCOUNTS_FILE_DEFAULT"
      echo "  -h  help"
      exit 0
      ;;
  esac
done

if ! command -v kurtosis &> /dev/null; then
  echo "kurtosis command not found. Please install kurtosis and try again."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "jq not found. Please install jq and try again."
  exit 1
fi

if ! command -v go &> /dev/null; then
  echo "go not found. Please install Go (https://go.dev/dl/) and try again."
  exit 1
fi

if [ ! -f "$ACCOUNTS_FILE" ]; then
  echo "accounts file not found: $ACCOUNTS_FILE"
  exit 1
fi

AUTOUI_SRC="$SCRIPT_DIR/clef_autoui/main.go"
if [ ! -f "$AUTOUI_SRC" ]; then
  echo "clef_autoui source not found: $AUTOUI_SRC"
  exit 1
fi

allowlist="$(jq -r '.[].address' "$ACCOUNTS_FILE" | paste -sd ';' -)"

tmp_dir="$(mktemp -d)"
cleanup() { rm -rf "$tmp_dir"; }
trap cleanup EXIT

mkdir -p "$tmp_dir/bin"

echo "Building clef-autoui binaries..."
GOCACHE="${GOCACHE:-$tmp_dir/go-build-cache}"
export GOCACHE

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "$tmp_dir/bin/clef-autoui-linux-amd64" "$AUTOUI_SRC"
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o "$tmp_dir/bin/clef-autoui-linux-arm64" "$AUTOUI_SRC"

cat > "$tmp_dir/start.sh" <<'EOF'
#!/usr/bin/env sh
set -eu

arch="$(uname -m)"
case "$arch" in
  x86_64|amd64)
    exec /clef-autoui/bin/clef-autoui-linux-amd64
    ;;
  aarch64|arm64)
    exec /clef-autoui/bin/clef-autoui-linux-arm64
    ;;
  *)
    echo "Unsupported arch: $arch" >&2
    exit 1
    ;;
esac
EOF
chmod 755 "$tmp_dir/start.sh" "$tmp_dir/bin/clef-autoui-linux-amd64" "$tmp_dir/bin/clef-autoui-linux-arm64"

echo "Uploading clef-autoui artifact to enclave $ENCLAVE_NAME ..."
artifact_name="clef-autoui-$(date +%s)"
kurtosis files upload --name "$artifact_name" "$ENCLAVE_NAME" "$tmp_dir"

echo "Updating $ENCLAVE_NAME/$CLEF_SERVICE_NAME to use clef-autoui..."
kurtosis service update "$ENCLAVE_NAME" "$CLEF_SERVICE_NAME" \
  --entrypoint /clef-autoui/start.sh \
  --files "/clef-keystore:clef,/clef-autoui:$artifact_name" \
  --env "CLEF_AUTOUI_PASSWORD=$CLEF_KEY_PASSWORD,CLEF_AUTOUI_ALLOWLIST=$allowlist"

echo "Clef auto-UI enabled."
