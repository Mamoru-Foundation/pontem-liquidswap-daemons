RPC_ADDRESS=https://validation-chain.testnet.mamoru.foundation:26657

publish:
	cd sql && mamoru-cli publish --rpc $(RPC_ADDRESS)
	cd wasm && mamoru-cli publish --rpc $(RPC_ADDRESS) --gas 10000000

test:
	cd wasm && npm run test

build:
	cd wasm && npm run build
