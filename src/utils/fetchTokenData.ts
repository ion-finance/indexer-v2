import { Address } from '@ton/ton'
import ton from '../clients/ton'
import { JettonWallet } from '../wrappers/JettonWallet'
import axios from 'axios'

const fetchTokenData = async (walletAddress: string) => {
  const jettonWallet = ton.open(
    JettonWallet.create(Address.parse(walletAddress)),
  )
  // TODO jettonWallet can be null
  const data = await jettonWallet.getWalletData()

  try {
    const res = await axios.get(
      `${process.env.TON_API_URL}/jettons/${data?.minter}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TON_API_KEY}`,
        },
      },
    )

    return {
      minter_address: data?.minter?.toString(),
      ...res.data,
    } as {
      minter_address: string
      mintable: boolean
      total_supply: string
      metadata: {
        address: string
        name: string
        symbol: string
        decimals: string
        image: string
        description: string
      }
      verification: string
      holders_count: number
    }
  } catch {
    return null
  }
}

export default fetchTokenData
