import { PoolType } from '@prisma/client'
import { address } from '@ton/core'

import prisma from 'src/clients/prisma'
import { parseTransferNotification } from 'src/parsers/cpmm/parseTransferNotification'
import { OP } from 'src/tasks/handleEvent/opCode'
import {
  changeNameOfProxyTon,
  changeSymbolOfProxyTon,
  findTracesByOpCode,
  parseRaw,
  sortByAddress,
} from 'src/utils/address'
import { bodyToCell } from 'src/utils/cell'
import { toISOString } from 'src/utils/date'
import fetchTokenData from 'src/utils/fetchTokenData'
import { warn } from 'src/utils/log'

import { JettonInfo, Trace } from '../../types/ton-api'

export const handlePoolCreated = async ({
  eventId,
  trace,
}: {
  eventId: string
  trace: Trace
}) => {
  const creator = parseRaw(trace.transaction.account.address)
  const provideLpTrace = findTracesByOpCode(trace, OP.PROVIDE_LP)?.[0]
  const transferNotificationTrace = findTracesByOpCode(
    trace,
    OP.TRANSFER_NOTIFICATION,
  )?.[0]
  if (!provideLpTrace) {
    warn('Empty provideLpTrace')
    return
  }
  if (!transferNotificationTrace) {
    warn('Empty transferNotificationTrace')
    return
  }

  const poolAddress = parseRaw(
    provideLpTrace.transaction?.in_msg?.destination?.address,
  )

  const { raw_body, source } =
    transferNotificationTrace.transaction.in_msg || {}
  if (!raw_body) {
    warn('Empty raw_body')
    return null
  }
  if (!source) {
    warn('Empty source')
    return null
  }

  const utime = transferNotificationTrace.transaction.utime
  const timestamp = toISOString(utime)

  // router jetton wallets
  const { tokenWallet1 } = parseTransferNotification(bodyToCell(raw_body))
  const sourceAddress = parseRaw(source.address)
  const sorted = sortByAddress([address(tokenWallet1), address(sourceAddress)])
  const tokenXAddress = sorted[0].toString()
  const tokenYAddress = sorted[1].toString()

  const [tokenXdata, tokenYdata] = await Promise.all([
    fetchTokenData(tokenXAddress),
    fetchTokenData(tokenYAddress),
  ])

  const tokenXSymbol = changeSymbolOfProxyTon(
    tokenXAddress,
    tokenXdata?.metadata?.symbol || '',
  )
  const tokenYSymbol = changeSymbolOfProxyTon(
    tokenYAddress,
    tokenYdata?.metadata?.symbol || '',
  )
  const tokenXName = changeNameOfProxyTon(
    tokenXAddress,
    tokenXdata?.metadata?.name || '',
  )
  const tokenYName = changeNameOfProxyTon(
    tokenYAddress,
    tokenYdata?.metadata?.name || '',
  )

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
        image: tokenXdata.metadata.image || '',
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
        image: tokenYdata.metadata.image || '',
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
