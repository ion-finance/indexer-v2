import { Address } from "@ton/ton";
import ton from "../clients/ton";
import { JettonWallet } from "../wrappers/JettonWallet";
import axios from "axios";

const fetchTokenData = async (walletAddress: string) => {
  const jettonWallet = ton.open(
    JettonWallet.create(Address.parse(walletAddress))
  );
  const data = await jettonWallet.getWalletData();

  const res = await axios.get(
    `${process.env.TON_API_URL}/jettons/${data?.minter}`
  );

  return {
    minter_address: data?.minter,
    ...res.data,
  } as {
    minter_address: string;
    mintable: boolean;
    total_supply: string;
    metadata: {
      address: string;
      name: string;
      symbol: string;
      decimals: string;
      image: string;
      description: string;
    };
    verification: string;
    holders_count: number;
  };
};

export default fetchTokenData;
