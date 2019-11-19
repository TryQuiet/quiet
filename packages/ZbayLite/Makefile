start:
	ZBAY_IS_TESTNET=1, ZBAY_NODE_URL=http://localhost:8334 npm run start

start-mainnet:
	ZBAY_IS_TESTNET=0 ZBAY_NODE_URL=http://localhost:8334 npm run start

start-internal:
	ZBAY_IS_TESTNET=1 npm run start

test:
	npm run test:watch

storybook:
	npm run storybook

testnet:
	docker-compose up znode-testnet

mainet:
	docker-compose up znode-mainnet
