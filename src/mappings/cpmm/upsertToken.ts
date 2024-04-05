import prisma from '../../clients/prisma'
import {
  changeNameOfProxyTon,
  changeSymbolOfProxyTon,
} from '../../utils/address'
import fetchTokenData from '../../utils/fetchTokenData'

export const upsertToken = async (tokenAddress: string) => {
  console.log('!!!!!!!!!!!!!!!!check upsert!!!!!!!!!!!!!!!!!!')
  const tokenData = await fetchTokenData(tokenAddress)
  if (tokenData) {
    return await prisma.token.upsert({
      where: {
        id: tokenAddress,
      },
      update: {
        jettonMinterAddress: tokenData.minter_address,
        name: changeNameOfProxyTon(tokenData.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenData.metadata.symbol),
        decimals: parseInt(tokenData.metadata.decimals),
        image: tokenData.metadata.image,
      },
      create: {
        id: tokenAddress,
        jettonMinterAddress: tokenData.minter_address,
        name: changeNameOfProxyTon(tokenData.metadata.name),
        symbol: changeSymbolOfProxyTon(tokenData.metadata.symbol),
        decimals: parseInt(tokenData.metadata.decimals),
        image: tokenData.metadata.image,
      },
    })
  }
  return null
}
