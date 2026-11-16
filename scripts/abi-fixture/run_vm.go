// This file is part of web3.js.
//
// web3.js is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// web3.js is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with web3.js.  If not, see <http://www.gnu.org/licenses/>.

// Executes Hyperion bytecode in go-qrl's VM for scripts/abi-fixture/generate.js.
// It is compiled inside a go-qrl checkout through a build overlay and is never
// part of a web3.js package.
//
// stdin:  {"bytecode": "0x…", "calls": [{"name": "…", "callData": "0x…"}]}
// stdout: [{"name": "…", "output": "0x…", "reverted": false, "logs": [{"topics": ["0x…"], "data": "0x…"}]}]
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/theQRL/go-qrl/common"
	"github.com/theQRL/go-qrl/common/hexutil"
	"github.com/theQRL/go-qrl/core/vm"
	"github.com/theQRL/go-qrl/core/vm/runtime"
)

type call struct {
	Name     string `json:"name"`
	CallData string `json:"callData"`
}

type logEntry struct {
	Topics []string `json:"topics"`
	Data   string   `json:"data"`
}

type result struct {
	Name     string     `json:"name"`
	Output   string     `json:"output"`
	Reverted bool       `json:"reverted"`
	Logs     []logEntry `json:"logs"`
}

func main() {
	var input struct {
		Bytecode string `json:"bytecode"`
		Calls    []call `json:"calls"`
	}
	if err := json.NewDecoder(os.Stdin).Decode(&input); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	results := make([]result, 0, len(input.Calls))
	for _, c := range input.Calls {
		// Every call runs against fresh, empty state.
		output, state, err := runtime.Execute(
			common.FromHex(input.Bytecode),
			common.FromHex(c.CallData),
			&runtime.Config{GasLimit: 10_000_000},
		)
		reverted := errors.Is(err, vm.ErrExecutionReverted)
		if err != nil && !reverted {
			fmt.Fprintf(os.Stderr, "%s: %v\n", c.Name, err)
			os.Exit(1)
		}
		logs := []logEntry{}
		if !reverted {
			for _, l := range state.Logs() {
				topics := make([]string, len(l.Topics))
				for i, topic := range l.Topics {
					topics[i] = hexutil.Encode(topic[:])
				}
				logs = append(logs, logEntry{Topics: topics, Data: hexutil.Encode(l.Data)})
			}
		}
		results = append(results, result{
			Name:     c.Name,
			Output:   hexutil.Encode(output),
			Reverted: reverted,
			Logs:     logs,
		})
	}
	if err := json.NewEncoder(os.Stdout).Encode(results); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
