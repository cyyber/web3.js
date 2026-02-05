#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ACCOUNTS_FILE_DEFAULT="$SCRIPT_DIR/../accounts.json"

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
      echo "Import scripts/accounts.json seeds into the Kurtosis clef service keystore."
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

if [ ! -f "$ACCOUNTS_FILE" ]; then
  echo "accounts file not found: $ACCOUNTS_FILE"
  exit 1
fi

tmp_pw_path="/tmp/clef-key-password.txt"
echo "Writing clef password file in container: $tmp_pw_path"
kurtosis service exec "$ENCLAVE_NAME" "$CLEF_SERVICE_NAME" \
  "sh -c 'set -eu; printf \"%s\" \"$CLEF_KEY_PASSWORD\" > $tmp_pw_path; chmod 600 $tmp_pw_path || true'"

echo "Reading existing clef accounts..."
existing_accounts_raw="$(
  kurtosis service exec "$ENCLAVE_NAME" "$CLEF_SERVICE_NAME" \
    "sh -c 'set -eu; clef --suppress-bootwarn --keystore=/clef-keystore/keystore list-accounts || true'"
)"

existing_accounts="$(
  printf '%s\n' "$existing_accounts_raw" \
    | awk '{print $1}' \
    | grep -E '^Q[0-9a-fA-F]{40}$' \
    | tr '[:upper:]' '[:lower:]' \
    | sort -u
)"

count="$(jq 'length' "$ACCOUNTS_FILE")"
echo "Importing $count seeds into $ENCLAVE_NAME/$CLEF_SERVICE_NAME ..."

while IFS=$'\t' read -r index address seed; do
  address_lc="$(printf '%s' "$address" | tr '[:upper:]' '[:lower:]')"
  if printf '%s\n' "$existing_accounts" | grep -Fqx "$address_lc"; then
    echo "- [$index] $address (already present)"
    continue
  fi
  # clef expects raw hex without the 0x prefix (it still accepts it sometimes, but keep it consistent).
  seed_no_prefix="${seed#0x}"
  seedfile="/tmp/seed-$index.txt"
  echo "- [$index] $address"
  kurtosis service exec "$ENCLAVE_NAME" "$CLEF_SERVICE_NAME" \
    "sh -c 'set -eu; printf \"%s\" \"$seed_no_prefix\" > $seedfile; clef --suppress-bootwarn --keystore=/clef-keystore/keystore importraw --password $tmp_pw_path $seedfile; rm -f $seedfile'"
done < <(jq -r 'to_entries[] | "\(.key)\t\(.value.address)\t\(.value.seed)"' "$ACCOUNTS_FILE")

echo "Done."
