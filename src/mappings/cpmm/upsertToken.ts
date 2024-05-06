import prisma from 'src/clients/prisma'
import { changeNameOfProxyTon, changeSymbolOfProxyTon } from 'src/utils/address'
import fetchTokenData from 'src/utils/fetchTokenData'

export const upsertToken = async (tokenAddress: string, timestamp: string) => {
  const tokenData = await fetchTokenData(tokenAddress)
  if (tokenData) {
    const name = changeNameOfProxyTon(tokenAddress, tokenData.metadata.name)
    const symbol = changeSymbolOfProxyTon(
      tokenAddress,
      tokenData.metadata.symbol,
    )
    return await prisma.token.upsert({
      where: {
        id: tokenAddress,
      },
      update: {
        jettonMinterAddress: tokenData.minter_address,
        name,
        symbol,
        decimals: parseInt(tokenData.metadata.decimals),
        image: tokenData.metadata.image,
      },
      create: {
        id: tokenAddress,
        jettonMinterAddress: tokenData.minter_address,
        name,
        symbol,
        decimals: parseInt(tokenData.metadata.decimals),
        image: tokenData.metadata.image,
        timestamp,
      },
    })
  }
  return null
}
