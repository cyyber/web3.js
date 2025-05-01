#!/usr/bin/env bash
# TODO: use this code in #5185
ORIGARGS=("$@")
. scripts/env.sh

helpFunction() {
	echo "Usage: $0 [start|stop] [background]"
	exit 1 # Exit script after printing help
}

start() {
	echo "Starting network..."
	kurtosis run --enclave testnet github.com/theQRL/zond-package --args-file scripts/network_params.yaml
}

stop() {
	echo "Stopping network..."
	kurtosis enclave rm -f testnet
}

case $1 in
start) start ;;
stop) stop ;;
*) helpFunction ;; # Print helpFunction in case parameter is non-existent
esac
