import { PoolType } from '@prisma/client'
import { address } from '@ton/core'

import prisma from 'src/clients/prisma'
import { parseTransferNotification } from 'src/parsers/cpmm/parseTransferNotification'
import { ParsedTransaction } from 'src/types/ton-center'
import {
  changeNameOfProxyTon,
  changeSymbolOfProxyTon,
  parseRaw,
  sortByAddress,
} from 'src/utils/address'
import { msgToCell } from 'src/utils/cell'
import { toISOString } from 'src/utils/date'
import fetchTokenData from 'src/utils/fetchTokenData'
import { warn } from 'src/utils/log'

export const handlePoolCreated = async ({
  transferNotificationTx,
  provideLpTx,
  addLiquidityTx,
}: {
  transferNotificationTx: ParsedTransaction
  provideLpTx: ParsedTransaction
  addLiquidityTx: ParsedTransaction
}) => {
  const poolAddress = provideLpTx.inMessage?.info?.dest?.toString()

  const transferNotificationString = transferNotificationTx.inMessage?.msg
  if (!transferNotificationString) {
    warn('Empty transferNotificationString')
    return
  }
  if (!poolAddress) {
    warn('Empty poolAddress')
    return
  }
  const { tokenWallet1, fromUser } = parseTransferNotification(
    msgToCell(transferNotificationString),
  )

  const utime = transferNotificationTx.now
  const timestamp = toISOString(utime)

  // router jetton wallets
  const sourceAddress = parseRaw(
    transferNotificationTx.inMessage?.info?.src?.toString(),
  )
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
      creator: fromUser,
    },
    update: {},
  })
}

export default handlePoolCreated
