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
docker run -p 5432:5432 --name postgres -e POSTGRES_PASSWORD=1q2w3e4r -d postgres
```

Create database `ionfi` in postgresql.

```
yarn prisma migrate dev
```

`.env` file is used to set environment variables. You can copy `.env.example` to `.env` and update the values.

```
DATABASE_URL=postgresql://postgres:1q2w3e4r@localhost:5432/ionfi
TON_API_URL=https://testnet.tonapi.io/v2
TON_API_KEY=1234
ROUTER_ADDRESS=EQBIyV2NPYJ5M5UUtTLLBvTKoew7wKfIZSdReKhqSkbNBPk_
TON_HUB_API_URL=https://sandbox.tonhubapi.com
```

The end of `TON_HUB_API_URL` should not have `/` character.
You can get `TON_API_KEY` from [tonapi.io](https://tonapi.io/).

## How to run

```
yarn

yarn local:watch
```

## How to index new log

Lets say we have a new log in ton contracts and we want to index it.
The name of event is `NewEvent` and it has 2 arguments: `address: address` and `value: uint256`.

<b>1. Add new db model to `prisma/scahma.prisma` </b>

```
model NewEvent {
  id        String   @id
  address   String
  value     String
  createdAt DateTime @default(now())
}
```

<b>2. Run `yarn prisma:generate` </b>

Prisma will generate new typescript types for you.

<b>3. Implement message parser in `src/parsers/parseNewEvent` </b>

logCode is like a opcode of event. It is used to identify event in logs.
Below parser code will be used to parse `NewEvent` logs.

```
import { Cell } from "@ton/core";

const parseNewEvent = (message: Cell) => {
  const body = message.beginParse();
  const logCode = body.loadUint(32);
  const address = body.loadAddress().toString;
  const value = body.loadUint(256);

  return {
    logCode,
    address
    value
  };
};

export default parseNewEvent;

```

<b>4. Implement database mapping </b>

In `src/mappings` create new file `handleNewEvent.ts` and implement mapping. Mapping is a function that takes parsed event and save to database.

```
import { Event } from "../types/events";
import prisma from "../clients/prisma";
import { Prisma } from "@prisma/client";
import parseNewEvent from "../parsers/parseNewEvent";

export const handleNewEvent = async (
  event: Event
) => {
  const params = parseNewEvent(event.params.message);
  console.log("NewEvent is indexed.");
  console.log(event);

  await prisma.newEvent.upsert({
    where: {
      id: event.transaction.hash,
    },
    update: {
      address: params.address,
      value: params.value
    },
    create: {
      address: params.address,
      value: params.value
    },
  })
);
```

<b> 5. Add the mapping to `src/tasks/handleEvent.ts`</b>

`handleEvent` task will be called for every event of `the router contract`. You need to add your mapping to `switch` statement.

```
const NEW_EVENT = "0x12345678"; // "new_event"c in func

...
switch (msg.op_code) {
  case DEPOSITED_TO_BINS: {
    await handleDepositedToBins({
      transaction,
      body,
    });
    break;
  }
  ...
  case NEW_EVENT: {
    await handleNewEvent({
      transaction,
      body,
    });
    break;
  }
  ...

```

## How to reset database

If you add new event to index or update router contrat address, you need to reset database to reindex all events.

`yarn prisma migrate reset`

If you want to reset remote database, you need to update `DATABASE_URL` environment variable.

In case of new schema, you need to run `yarn prisma migrate dev` to create new table. It is recommended to remove all `prisma/migrations` files before running the command in test or development environment.
