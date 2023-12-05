import { Address, Contract, ContractProvider } from "@ton/core";

export class JettonWallet implements Contract {
  static create(address: Address) {
    return new JettonWallet(address);
  }

  readonly address: Address;

  private constructor(address: Address) {
    this.address = address;
  }

  async getBalance(provider: ContractProvider) {
    const state = await provider.getState();
    if (state.state.type !== "active") {
      return BigInt(0);
    }
    const res = await provider.get("get_wallet_data", []);
    return res.stack.readBigNumber();
  }

  async getWalletData(provider: ContractProvider) {
    const state = await provider.getState();
    if (state.state.type !== "active") {
      return;
    }
    const res = await provider.get("get_wallet_data", []);

    return {
      balance: res.stack.readBigNumber(),
      owner: res.stack.readAddress(),
      minter: res.stack.readAddress(),
    };
  }
}
