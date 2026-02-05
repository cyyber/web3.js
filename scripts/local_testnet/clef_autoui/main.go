package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"sync"
	"syscall"
)

type rpcRequest struct {
	JSONRPC string            `json:"jsonrpc"`
	Method  string            `json:"method"`
	Params  []json.RawMessage `json:"params,omitempty"`
	ID      *json.RawMessage  `json:"id,omitempty"`
}

type rpcResponse struct {
	JSONRPC string           `json:"jsonrpc"`
	Result  any              `json:"result,omitempty"`
	Error   *rpcResponseError `json:"error,omitempty"`
	ID      json.RawMessage  `json:"id"`
}

type rpcResponseError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type inputRequest struct {
	Title      string `json:"title"`
	Prompt     string `json:"prompt"`
	IsPassword bool   `json:"isPassword"`
}

func main() {
	var (
		clefBin         = flag.String("clef-bin", "clef", "Path to the clef binary in the container")
		keystoreDir     = flag.String("keystore", "/clef-keystore/keystore", "Clef keystore dir")
		chainID         = flag.Int64("chainid", 3151908, "Chain ID")
		loglevel        = flag.Int("loglevel", 3, "Clef loglevel")
		httpAddr        = flag.String("http.addr", "0.0.0.0", "Clef HTTP listen addr")
		httpPort        = flag.Int("http.port", 8550, "Clef HTTP listen port")
		httpVhosts      = flag.String("http.vhosts", "*", "Clef HTTP vhosts")
		passwordEnv     = flag.String("password-env", "CLEF_AUTOUI_PASSWORD", "Env var containing the password to answer ui_onInputRequired")
		allowlistEnv    = flag.String("allowlist-env", "CLEF_AUTOUI_ALLOWLIST", "Env var containing a ';' separated allowlist of from-addresses; empty means approve all")
		approveAll      = flag.Bool("approve-all", false, "Approve all requests (overrides allowlist)")
		verboseRequests = flag.Bool("verbose", false, "Log incoming UI RPC requests to stderr")
	)
	flag.Parse()

	password := os.Getenv(*passwordEnv)
	if password == "" {
		password = "passwordpassword"
	}
	allowlist := parseAllowlist(os.Getenv(*allowlistEnv))

	clefArgs := []string{
		"--stdio-ui",
		fmt.Sprintf("--loglevel=%d", *loglevel),
		fmt.Sprintf("--keystore=%s", *keystoreDir),
		fmt.Sprintf("--chainid=%d", *chainID),
		fmt.Sprintf("--http.addr=%s", *httpAddr),
		fmt.Sprintf("--http.vhosts=%s", *httpVhosts),
		"--http",
		fmt.Sprintf("--http.port=%d", *httpPort),
		"--suppress-bootwarn",
	}

	cmd := exec.Command(*clefBin, clefArgs...)
	cmd.Stderr = os.Stderr

	clefStdin, err := cmd.StdinPipe()
	if err != nil {
		fatal(err)
	}
	clefStdout, err := cmd.StdoutPipe()
	if err != nil {
		fatal(err)
	}

	if err := cmd.Start(); err != nil {
		fatal(err)
	}

	// Forward signals to the clef child process.
	sigCh := make(chan os.Signal, 4)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP, syscall.SIGQUIT)
	go func() {
		for sig := range sigCh {
			_ = cmd.Process.Signal(sig)
		}
	}()

	uiDone := make(chan struct{})
	go func() {
		defer close(uiDone)
		serveUI(clefStdout, clefStdin, password, allowlist, *approveAll, *verboseRequests)
	}()

	waitErr := cmd.Wait()
	_ = clefStdin.Close()
	<-uiDone

	if waitErr == nil {
		os.Exit(0)
	}
	var exitErr *exec.ExitError
	if errors.As(waitErr, &exitErr) {
		os.Exit(exitErr.ExitCode())
	}
	fatal(waitErr)
}

func parseAllowlist(value string) map[string]struct{} {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	m := make(map[string]struct{})
	for _, entry := range strings.Split(trimmed, ";") {
		addr := strings.ToLower(strings.TrimSpace(entry))
		if addr == "" {
			continue
		}
		m[addr] = struct{}{}
	}
	return m
}

func serveUI(fromClef io.Reader, toClef io.Writer, password string, allowlist map[string]struct{}, approveAll bool, verbose bool) {
	decoder := json.NewDecoder(fromClef)
	encoder := json.NewEncoder(toClef)
	encoder.SetEscapeHTML(false)

	var writeMu sync.Mutex

	writeResponse := func(resp rpcResponse) {
		writeMu.Lock()
		defer writeMu.Unlock()
		_ = encoder.Encode(resp)
	}

	for {
		var raw json.RawMessage
		if err := decoder.Decode(&raw); err != nil {
			if errors.Is(err, io.EOF) {
				return
			}
			log.Printf("clef-autoui: decode error: %v", err)
			return
		}
		raw = bytes.TrimSpace(raw)
		if len(raw) == 0 {
			continue
		}

		if raw[0] == '[' {
			var batch []rpcRequest
			if err := json.Unmarshal(raw, &batch); err != nil {
				log.Printf("clef-autoui: bad batch request: %v", err)
				continue
			}
			var responses []rpcResponse
			for _, req := range batch {
				resp := handleRequest(req, password, allowlist, approveAll, verbose)
				if resp != nil {
					responses = append(responses, *resp)
				}
			}
			if len(responses) == 0 {
				continue
			}
			writeMu.Lock()
			_ = encoder.Encode(responses)
			writeMu.Unlock()
			continue
		}

		var req rpcRequest
		if err := json.Unmarshal(raw, &req); err != nil {
			log.Printf("clef-autoui: bad request: %v", err)
			continue
		}
		resp := handleRequest(req, password, allowlist, approveAll, verbose)
		if resp == nil {
			continue
		}
		writeResponse(*resp)
	}
}

func handleRequest(req rpcRequest, password string, allowlist map[string]struct{}, approveAll bool, verbose bool) *rpcResponse {
	if verbose {
		log.Printf("clef-autoui: %s", req.Method)
	}

	// Notifications do not have an ID.
	if req.ID == nil {
		switch req.Method {
		case "ui_showInfo", "ui_showError", "ui_onApprovedTx", "ui_onSignerStartup":
			// Ignore; clef uses these as notifications.
			return nil
		default:
			return nil
		}
	}

	id := *req.ID
	if len(id) == 0 {
		// Defensive: treat empty id as notification.
		return nil
	}

	switch req.Method {
	case "ui_onInputRequired":
		var in inputRequest
		if len(req.Params) > 0 {
			_ = json.Unmarshal(req.Params[0], &in)
		}
		if in.IsPassword {
			return &rpcResponse{JSONRPC: "2.0", ID: id, Result: map[string]any{"text": password}}
		}
		return &rpcResponse{JSONRPC: "2.0", ID: id, Result: map[string]any{"text": ""}}

	case "ui_approveTx":
		approved, txObj := approveByFrom(req.Params, allowlist, approveAll)
		return &rpcResponse{
			JSONRPC: "2.0",
			ID:      id,
			Result:  map[string]any{"transaction": txObj, "approved": approved},
		}

	case "ui_approveSignData":
		approved := approveByAddress(req.Params, "address", allowlist, approveAll)
		return &rpcResponse{JSONRPC: "2.0", ID: id, Result: map[string]any{"approved": approved}}

	case "ui_approveListing":
		var payload map[string]any
		if len(req.Params) > 0 {
			_ = json.Unmarshal(req.Params[0], &payload)
		}
		accounts, _ := payload["accounts"].([]any)
		if approveAll || allowlist == nil || len(accounts) == 0 {
			return &rpcResponse{JSONRPC: "2.0", ID: id, Result: map[string]any{"accounts": accounts}}
		}
		filtered := make([]any, 0, len(accounts))
		for _, acc := range accounts {
			accObj, ok := acc.(map[string]any)
			if !ok {
				continue
			}
			addr, _ := accObj["address"].(string)
			if addr == "" {
				continue
			}
			if _, ok := allowlist[strings.ToLower(addr)]; ok {
				filtered = append(filtered, acc)
			}
		}
		return &rpcResponse{JSONRPC: "2.0", ID: id, Result: map[string]any{"accounts": filtered}}

	case "ui_approveNewAccount":
		// Disallow creating new accounts via RPC by default.
		return &rpcResponse{JSONRPC: "2.0", ID: id, Result: map[string]any{"approved": false}}

	default:
		return &rpcResponse{
			JSONRPC: "2.0",
			ID:      id,
			Error:   &rpcResponseError{Code: -32601, Message: "Method not found"},
		}
	}
}

func approveByFrom(params []json.RawMessage, allowlist map[string]struct{}, approveAll bool) (bool, any) {
	var payload map[string]any
	if len(params) > 0 {
		_ = json.Unmarshal(params[0], &payload)
	}
	txObj, _ := payload["transaction"].(map[string]any)
	if approveAll || allowlist == nil {
		return true, txObj
	}
	from, _ := txObj["from"].(string)
	if from == "" {
		return false, txObj
	}
	_, ok := allowlist[strings.ToLower(from)]
	return ok, txObj
}

func approveByAddress(params []json.RawMessage, key string, allowlist map[string]struct{}, approveAll bool) bool {
	if approveAll || allowlist == nil {
		return true
	}
	var payload map[string]any
	if len(params) > 0 {
		_ = json.Unmarshal(params[0], &payload)
	}
	addr, _ := payload[key].(string)
	if addr == "" {
		return false
	}
	_, ok := allowlist[strings.ToLower(addr)]
	return ok
}

func fatal(err error) {
	log.Fatal("clef-autoui: ", err)
}
