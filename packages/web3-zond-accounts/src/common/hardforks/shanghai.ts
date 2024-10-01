export default {
	"name": "shanghai",
	"comment": "Start of the Zond main chain",
	"url": "",
	"status": "",
	"gasConfig": {
		"minGasLimit": {
			"v": 5000,
			"d": "Minimum the gas limit may ever be"
		},
		"gasLimitBoundDivisor": {
			"v": 1024,
			"d": "The bound divisor of the gas limit, used in update calculations"
		},
		"maxRefundQuotient": {
			"v": 5,
			"d": "Maximum refund quotient; max tx refund is min(tx.gasUsed/maxRefundQuotient, tx.gasRefund)"
		},
		"baseFeeMaxChangeDenominator": {
			"v": 8,
			"d": "Maximum base fee change denominator"
		},
		"elasticityMultiplier": {
			"v": 2,
			"d": "Maximum block gas target elasticity"
		},
		"initialBaseFee": {
			"v": 1000000000,
			"d": "Initial base fee on first EIP1559 block"
		}
	},
	"gasPrices": {
		"base": {
			"v": 2,
			"d": "Gas base cost, used e.g. for ChainID opcode (Istanbul)"
		},
		"tierStep": {
			"v": [0, 2, 3, 5, 8, 10, 20],
			"d": "Once per operation, for a selection of them"
		},
		"exp": {
			"v": 10,
			"d": "Base fee of the EXP opcode"
		},
		"expByte": {
			"v": 50,
			"d": "Times ceil(log256(exponent)) for the EXP instruction"
		},
		"sha3": {
			"v": 30,
			"d": "Base fee of the SHA3 opcode"
		},
		"sha3Word": {
			"v": 6,
			"d": "Once per word of the SHA3 operation's data"
		},
		"sload": {
			"v": 0,
			"d": "Base fee of the SLOAD opcode"
		},
		"sstoreSet": {
			"v": 20000,
			"d": "Once per SSTORE operation if the zeroness changes from zero"
		},
		"sstoreReset": {
			"v": 5000,
			"d": "Once per SSTORE operation if the zeroness does not change from zero"
		},
		"sstoreRefund": {
			"v": 15000,
			"d": "Once per SSTORE operation if the zeroness changes to zero"
		},
		"jumpdest": {
			"v": 1,
			"d": "Base fee of the JUMPDEST opcode"
		},
		"log": {
			"v": 375,
			"d": "Base fee of the LOG opcode"
		},
		"logData": {
			"v": 8,
			"d": "Per byte in a LOG* operation's data"
		},
		"logTopic": {
			"v": 375,
			"d": "Multiplied by the * of the LOG*, per LOG transaction. e.g. LOG0 incurs 0 * c_txLogTopicGas, LOG4 incurs 4 * c_txLogTopicGas"
		},
		"create": {
			"v": 32000,
			"d": "Base fee of the CREATE opcode"
		},
		"call": {
			"v": 0,
			"d": "Base fee of the CALL opcode"
		},
		"callStipend": {
			"v": 2300,
			"d": "Free gas given at beginning of call"
		},
		"callValueTransfer": {
			"v": 9000,
			"d": "Paid for CALL when the value transfor is non-zero"
		},
		"callNewAccount": {
			"v": 25000,
			"d": "Paid for CALL when the destination address didn't exist prior"
		},
		"memory": {
			"v": 3,
			"d": "Times the address of the (highest referenced byte in memory + 1). NOTE: referencing happens on read, write and in instructions such as RETURN and CALL"
		},
		"quadCoeffDiv": {
			"v": 512,
			"d": "Divisor for the quadratic particle of the memory cost equation"
		},
		"createData": {
			"v": 200,
			"d": ""
		},
		"tx": {
			"v": 21000,
			"d": "Per transaction. NOTE: Not payable on data of calls between transactions"
		},
		"txCreation": {
			"v": 32000,
			"d": "The cost of creating a contract via tx"
		},
		"txDataZero": {
			"v": 4,
			"d": "Per byte of data attached to a transaction that equals zero. NOTE: Not payable on data of calls between transactions"
		},
		"txDataNonZero": {
			"v": 16,
			"d": "Per byte of data attached to a transaction that is not equal to zero. NOTE: Not payable on data of calls between transactions"
		},
		"copy": {
			"v": 3,
			"d": "Multiplied by the number of 32-byte words that are copied (round up) for any *COPY operation and added"
		},
		"depositroot": {
			"v": 19992,
			"d": ""
		},
		"sha256": {
			"v": 60,
			"d": ""
		},
		"sha256Word": {
			"v": 12,
			"d": ""
		},
		"identity": {
			"v": 15,
			"d": ""
		},
		"identityWord": {
			"v": 3,
			"d": ""
		},
		"stop": {
			"v": 0,
			"d": "Base fee of the STOP opcode"
		},
		"add": {
			"v": 3,
			"d": "Base fee of the ADD opcode"
		},
		"mul": {
			"v": 5,
			"d": "Base fee of the MUL opcode"
		},
		"sub": {
			"v": 3,
			"d": "Base fee of the SUB opcode"
		},
		"div": {
			"v": 5,
			"d": "Base fee of the DIV opcode"
		},
		"sdiv": {
			"v": 5,
			"d": "Base fee of the SDIV opcode"
		},
		"mod": {
			"v": 5,
			"d": "Base fee of the MOD opcode"
		},
		"smod": {
			"v": 5,
			"d": "Base fee of the SMOD opcode"
		},
		"addmod": {
			"v": 8,
			"d": "Base fee of the ADDMOD opcode"
		},
		"mulmod": {
			"v": 8,
			"d": "Base fee of the MULMOD opcode"
		},
		"signextend": {
			"v": 5,
			"d": "Base fee of the SIGNEXTEND opcode"
		},
		"lt": {
			"v": 3,
			"d": "Base fee of the LT opcode"
		},
		"gt": {
			"v": 3,
			"d": "Base fee of the GT opcode"
		},
		"slt": {
			"v": 3,
			"d": "Base fee of the SLT opcode"
		},
		"sgt": {
			"v": 3,
			"d": "Base fee of the SGT opcode"
		},
		"eq": {
			"v": 3,
			"d": "Base fee of the EQ opcode"
		},
		"iszero": {
			"v": 3,
			"d": "Base fee of the ISZERO opcode"
		},
		"and": {
			"v": 3,
			"d": "Base fee of the AND opcode"
		},
		"or": {
			"v": 3,
			"d": "Base fee of the OR opcode"
		},
		"xor": {
			"v": 3,
			"d": "Base fee of the XOR opcode"
		},
		"not": {
			"v": 3,
			"d": "Base fee of the NOT opcode"
		},
		"byte": {
			"v": 3,
			"d": "Base fee of the BYTE opcode"
		},
		"address": {
			"v": 2,
			"d": "Base fee of the ADDRESS opcode"
		},
		"balance": {
			"v": 0,
			"d": "Base fee of the BALANCE opcode"
		},
		"origin": {
			"v": 2,
			"d": "Base fee of the ORIGIN opcode"
		},
		"caller": {
			"v": 2,
			"d": "Base fee of the CALLER opcode"
		},
		"callvalue": {
			"v": 2,
			"d": "Base fee of the CALLVALUE opcode"
		},
		"calldataload": {
			"v": 3,
			"d": "Base fee of the CALLDATALOAD opcode"
		},
		"calldatasize": {
			"v": 2,
			"d": "Base fee of the CALLDATASIZE opcode"
		},
		"calldatacopy": {
			"v": 3,
			"d": "Base fee of the CALLDATACOPY opcode"
		},
		"codesize": {
			"v": 2,
			"d": "Base fee of the CODESIZE opcode"
		},
		"codecopy": {
			"v": 3,
			"d": "Base fee of the CODECOPY opcode"
		},
		"gasprice": {
			"v": 2,
			"d": "Base fee of the GASPRICE opcode"
		},
		"extcodesize": {
			"v": 0,
			"d": "Base fee of the EXTCODESIZE opcode"
		},
		"extcodecopy": {
			"v": 0,
			"d": "Base fee of the EXTCODECOPY opcode"
		},
		"blockhash": {
			"v": 20,
			"d": "Base fee of the BLOCKHASH opcode"
		},
		"coinbase": {
			"v": 2,
			"d": "Base fee of the COINBASE opcode"
		},
		"timestamp": {
			"v": 2,
			"d": "Base fee of the TIMESTAMP opcode"
		},
		"number": {
			"v": 2,
			"d": "Base fee of the NUMBER opcode"
		},
		"prevrandao": {
			"v": 2,
			"d": "Base fee of the PREVRANDAO opcode"
		},
		"gaslimit": {
			"v": 2,
			"d": "Base fee of the GASLIMIT opcode"
		},
		"pop": {
			"v": 2,
			"d": "Base fee of the POP opcode"
		},
		"mload": {
			"v": 3,
			"d": "Base fee of the MLOAD opcode"
		},
		"mstore": {
			"v": 3,
			"d": "Base fee of the MSTORE opcode"
		},
		"mstore8": {
			"v": 3,
			"d": "Base fee of the MSTORE8 opcode"
		},
		"sstore": {
			"v": 0,
			"d": "Base fee of the SSTORE opcode"
		},
		"jump": {
			"v": 8,
			"d": "Base fee of the JUMP opcode"
		},
		"jumpi": {
			"v": 10,
			"d": "Base fee of the JUMPI opcode"
		},
		"pc": {
			"v": 2,
			"d": "Base fee of the PC opcode"
		},
		"msize": {
			"v": 2,
			"d": "Base fee of the MSIZE opcode"
		},
		"gas": {
			"v": 2,
			"d": "Base fee of the GAS opcode"
		},
		"push": {
			"v": 3,
			"d": "Base fee of the PUSH opcode"
		},
		"dup": {
			"v": 3,
			"d": "Base fee of the DUP opcode"
		},
		"swap": {
			"v": 3,
			"d": "Base fee of the SWAP opcode"
		},
		"return": {
			"v": 0,
			"d": "Base fee of the RETURN opcode"
		},
		"invalid": {
			"v": 0,
			"d": "Base fee of the INVALID opcode"
		},
		"delegatecall": {
			"v": 0,
			"d": "Base fee of the DELEGATECALL opcode"
		},
		"modexpGquaddivisor": {
			"v": 3,
			"d": "Gquaddivisor from modexp precompile for gas calculation"
		},
		"ecAdd": {
			"v": 150,
			"d": "Gas costs for curve addition precompile"
		},
		"ecMul": {
			"v": 6000,
			"d": "Gas costs for curve multiplication precompile"
		},
		"ecPairing": {
			"v": 45000,
			"d": "Base gas costs for curve pairing precompile"
		},
		"ecPairingWord": {
			"v": 34000,
			"d": "Gas costs regarding curve pairing precompile input length"
		},
		"revert": {
			"v": 0,
			"d": "Base fee of the REVERT opcode"
		},
		"staticcall": {
			"v": 0,
			"d": "Base fee of the STATICCALL opcode"
		},
		"returndatasize": {
			"v": 2,
			"d": "Base fee of the RETURNDATASIZE opcode"
		},
		"returndatacopy": {
			"v": 3,
			"d": "Base fee of the RETURNDATACOPY opcode"
		},
		"shl": {
			"v": 3,
			"d": "Base fee of the SHL opcode"
		},
		"shr": {
			"v": 3,
			"d": "Base fee of the SHR opcode"
		},
		"sar": {
			"v": 3,
			"d": "Base fee of the SAR opcode"
		},
		"extcodehash": {
			"v": 0,
			"d": "Base fee of the EXTCODEHASH opcode"
		},
		"create2": {
			"v": 32000,
			"d": "Base fee of the CREATE2 opcode"
		},
		"blake2Round": {
			"v": 1,
			"d": "Gas cost per round for the Blake2 F precompile"
		},
		"sstoreSentryGasEIP2200": {
			"v": 2300,
			"d": "Minimum gas required to be present for an SSTORE call, not consumed"
		},
		"sstoreNoopGasEIP2200": {
			"v": 100,
			"d": "Once per SSTORE operation if the value doesn't change"
		},
		"sstoreDirtyGasEIP2200": {
			"v": 100,
			"d": "Once per SSTORE operation if a dirty value is changed"
		},
		"sstoreInitGasEIP2200": {
			"v": 20000,
			"d": "Once per SSTORE operation from clean zero to non-zero"
		},
		"sstoreInitRefundEIP2200": {
			"v": 19900,
			"d": "Once per SSTORE operation for resetting to the original zero value"
		},
		"sstoreCleanGasEIP2200": {
			"v": 2900,
			"d": "Once per SSTORE operation from clean non-zero to something else"
		},
		"sstoreCleanRefundEIP2200": {
			"v": 4900,
			"d": "Once per SSTORE operation for resetting to the original non-zero value"
		},
		"sstoreClearRefundEIP2200": {
			"v": 4800,
			"d": "Once per SSTORE operation for clearing an originally existing storage slot"
		},
		"chainid": {
			"v": 2,
			"d": "Base fee of the CHAINID opcode"
		},
		"selfbalance": {
			"v": 5,
			"d": "Base fee of the SELFBALANCE opcode"
		},
		"coldsload": {
			"v": 2100,
			"d": "Gas cost of the first read of storage from a given location (per transaction)"
		},
		"coldaccountaccess": {
			"v": 2600,
			"d": "Gas cost of the first read of a given address (per transaction)"
		},
		"warmstorageread": {
			"v": 100,
			"d": "Gas cost of reading storage locations which have already loaded 'cold'"
		},
		"accessListStorageKeyCost": {
			"v": 1900,
			"d": "Gas cost per storage key in an Access List transaction"
		},
		"accessListAddressCost": {
			"v": 2400,
			"d": "Gas cost per storage key in an Access List transaction"
		},
		"basefee": {
			"v": 2,
			"d": "Gas cost of the BASEFEE opcode"
		},
		"push0": {
			"v": 2,
			"d": "Base fee of the PUSH0 opcode"
		},
		"initCodeWordCost": {
			"v": 2,
			"d": "Gas to pay for each word (32 bytes) of initcode when creating a contract"
		}
	},
	"vm": {
		"stackLimit": {
			"v": 1024,
			"d": "Maximum size of VM stack allowed"
		},
		"callCreateDepth": {
			"v": 1024,
			"d": "Maximum depth of call/create stack"
		},
		"maxExtraDataSize": {
			"v": 32,
			"d": "Maximum size extra data may be after Genesis"
		},
		"maxCodeSize": {
			"v": 24576,
			"d": "Maximum length of contract code"
		},
		"maxInitCodeSize": {
			"v": 49152,
			"d": "Maximum length of initialization code when creating a contract"
		}
	}
}
 ;