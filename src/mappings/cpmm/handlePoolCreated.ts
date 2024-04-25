import { PoolType } from '@prisma/client'
import { Cell, address } from '@ton/core'

import prisma from 'src/clients/prisma'
import { OP } from 'src/tasks/handleEvent/opCode'
import {
  changeNameOfProxyTon,
  changeSymbolOfProxyTon,
  findTracesByOpCode,
  parseRaw,
  sortByAddress,
} from 'src/utils/address'
import { toISOString } from 'src/utils/date'
import fetchTokenData from 'src/utils/fetchTokenData'

import { Trace } from '../../types/ton-api'

const parseTransferNotification = (raw_body: string) => {
  const message = Cell.fromBoc(Buffer.from(raw_body, 'hex'))[0]
  const body = message.beginParse()
  const op = body.loadUint(32)
  const queryId = body.loadUint(64)
  const jettonAmount = body.loadCoins()
  const fromUser = body.loadAddress().toString()
  const c = body.loadRef()
  const cs = c.beginParse()
  const transferredOp = cs.loadUint(32)
  const tokenWallet1 = cs.loadAddress().toString() // router jetton wallet
  const minLpOut = cs.loadCoins()

  return {
    op,
    queryId,
    jettonAmount,
    fromUser,
    transferredOp,
    tokenWallet1,
    minLpOut,
  }
}

export const handlePoolCreated = async ({
  eventId,
  traces,
}: {
  eventId: string
  traces: Trace
}) => {
  const creator = parseRaw(traces.transaction.account.address)
  const provideLpTrace = findTracesByOpCode(traces, OP.PROVIDE_LP)?.[0]
  const transferNotificationTrace = findTracesByOpCode(
    traces,
    OP.TRANSFER_NOTIFICATION,
  )?.[0]
  if (!provideLpTrace) {
    console.warn('Empty provideLpTrace')
    return
  }
  if (!transferNotificationTrace) {
    console.warn('Empty transferNotificationTrace')
    return
  }

  const poolAddress = parseRaw(
    provideLpTrace.transaction?.in_msg?.destination?.address,
  )

  const { raw_body, source } =
    transferNotificationTrace.transaction.in_msg || {}
  if (!raw_body) {
    console.warn('Empty raw_body')
    return null
  }
  if (!source) {
    console.warn('Empty source')
    return null
  }

  const utime = transferNotificationTrace.transaction.utime
  const timestamp = toISOString(utime)

  // router jetton wallets
  const { tokenWallet1 } = parseTransferNotification(raw_body)
  const sourceAddress = parseRaw(source.address)
  const sorted = sortByAddress([address(tokenWallet1), address(sourceAddress)])
  const tokenXAddress = sorted[0].toString()
  const tokenYAddress = sorted[1].toString()

  const [tokenXdata, tokenYdata] = await Promise.all([
    fetchTokenData(tokenXAddress),
    fetchTokenData(tokenYAddress),
  ])

  const tokenXSymbol = changeSymbolOfProxyTon(
    tokenXdata?.metadata?.symbol || '',
  )
  const tokenYSymbol = changeSymbolOfProxyTon(
    tokenYdata?.metadata?.symbol || '',
  )
  const tokenXName = changeNameOfProxyTon(tokenXdata?.metadata?.name || '')
  const tokenYName = changeNameOfProxyTon(tokenYdata?.metadata?.name || '')

  if (tokenXdata) {
    await prisma.token.upsert({
      where: {
        id: tokenXAddress,
      },
      update: {
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXName,
        symbol: tokenXSymbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
      },
      create: {
        id: tokenXAddress,
        jettonMinterAddress: tokenXdata.minter_address,
        name: tokenXName,
        symbol: tokenXSymbol,
        decimals: parseInt(tokenXdata.metadata.decimals),
        image: tokenXdata.metadata.image,
        timestamp,
      },
    })
  }

  if (tokenYdata) {
    await prisma.token.upsert({
      where: {
        id: tokenYAddress,
      },
      update: {
        jettonMinterAddress: tokenYdata.minter_address,
        name: tokenYName,
        symbol: tokenYSymbol,
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
      },
      create: {
        id: tokenYAddress,
        jettonMinterAddress: tokenYdata.minter_address,
        name: tokenYName,
        symbol: tokenYSymbol,
        decimals: parseInt(tokenYdata.metadata.decimals),
        image: tokenYdata.metadata.image,
        timestamp,
      },
    })
  }

  await prisma.pool.upsert({
    where: {
      id: poolAddress,
    },
    create: {
      id: poolAddress,
      name: `${tokenXSymbol}-${tokenYSymbol}`,
      type: PoolType.CPMM,
      tokenXAddress: tokenXAddress,
      tokenYAddress: tokenYAddress,
      timestamp,
      creator,
    },
    update: {},
  })
}

export default handlePoolCreated
