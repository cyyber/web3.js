#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

ENCLAVE_NAME=${ENCLAVE_NAME:-local-testnet}
CLEF_SERVICE_NAME=${CLEF_SERVICE_NAME:-signer-clef}
CLEF_KEY_PASSWORD=${CLEF_KEY_PASSWORD:-passwordpassword}
ACCOUNTS_FILE=${ACCOUNTS_FILE:-$SCRIPT_DIR/../accounts.json}

while getopts "e:s:p:f:h" flag; do
  case "${flag}" in
    e) ENCLAVE_NAME=${OPTARG};;
    s) CLEF_SERVICE_NAME=${OPTARG};;
    p) CLEF_KEY_PASSWORD=${OPTARG};;
    f) ACCOUNTS_FILE=${OPTARG};;
    h)
      echo "Enable clef auto-authorization and import scripts/accounts.json into clef."
      echo
      echo "usage: $0 [options]"
      echo
      echo "options:"
      echo "  -e  enclave name              default: $ENCLAVE_NAME"
      echo "  -s  clef service name         default: $CLEF_SERVICE_NAME"
      echo "  -p  clef key password         default: (from \$CLEF_KEY_PASSWORD or 'passwordpassword')"
      echo "  -f  accounts.json path        default: $SCRIPT_DIR/../accounts.json"
      echo "  -h  help"
      exit 0
      ;;
  esac
done

"$SCRIPT_DIR/enable_clef_autoui.sh" -e "$ENCLAVE_NAME" -s "$CLEF_SERVICE_NAME" -p "$CLEF_KEY_PASSWORD" -f "$ACCOUNTS_FILE"
"$SCRIPT_DIR/import_accounts_to_clef.sh" -e "$ENCLAVE_NAME" -s "$CLEF_SERVICE_NAME" -p "$CLEF_KEY_PASSWORD" -f "$ACCOUNTS_FILE"

