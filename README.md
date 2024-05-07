# Ion Indexer

Ion Indexer is a indexer to index events of Ion contracts. It is used to provide data for IonFi app.

## Supported Events or Logs

- DepositedToBins
- Initialized
- WithdrawnFromBins
- Swap
- TransferBatch

## Getting Started

Prepare database. You can use docker to run postgresql like below.

```
docker run -d --name timescaledb -p 5432:5432 -e POSTGRES_PASSWORD=1q2w3e4r -d timescale/timescaledb-ha:pg16
```

Create database `ionfi` in postgresql.

```
yarn prisma migrate dev
```

`.env` file is used to set environment variables. You can copy `.env.example` to `.env` and update the values.

```
DATABASE_URL=
TON_API_URL=https://testnet.tonapi.io/v2
TON_API_KEY=
TON_CENTER_API_URL=https://testnet.toncenter.com/api/v2/jsonRPC
TON_CENTER_API_KEY=
COINMARKET_CAP_API_KEY=

# testnet setting
USDT_MINTER_ADDRESS=kQBD5rI620ZgEU_0Wy-XMb-Zv56lLP2fHhSqSfxEyrs0OJtz
USDT_WALLET_ADDRESS=EQD2bKffQqv5SVT1847-0Cra9tX6zwBkIPC-r3Or5B2CUD8z
ROUTER_ADDRESS=EQDz8HJdCWlZXsQNq4C0K0r9CdLHoC5Ebiwdl5R495bje0Eg
TON_WALLET_ADDRESS=EQAmWnI-Tcgyr6US63TK6FtM_OVgV-jSqvj2fvCXgqNPokCh
TON_MINTER_ADDRESS=kQDauk3DRKg3Gtfk7NrZVz1rrI-8WdYt3368iOZcyMi3mief
```

The end of `TON_HUB_API_URL` should not have `/` character.
You can get `TON_API_KEY` from [tonapi.io](https://tonapi.io/).

## How to run

```
yarn

yarn local:watch
```

## How to reset database

Because we use 'timescaledb' for high
We are using timescaledb to store time series data.
So after initializing the data in the table, some instruction needed for applying timescaledb to specific column.

```
yarn restart
```

## Testing

In '.env.test' file, you have to set DATABASE_URL to test database.
See example below:

```
DATABASE_URL=postgresql://postgres:1q2w3e4r@localhost:5432/ionfi_test
```

To run tests, you can use the following command:

```
yarn test test/integrations/index.spec.ts
```
