import _ from "lodash";
import { Address, beginCell, Cell, Contract, ContractProvider } from "ton-core";

export class StablePool implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new StablePool(address);
  }

  // getters
  async getStorage(provider: ContractProvider) {
    const { stack } = await provider.get("get_storage", []);

    const router_address = stack.readAddress();
    const n_coins = stack.readNumber();
    const fee = stack.readBigNumber();
    const admin_fee_ratio = stack.readBigNumber();
    const is_initialized = stack.readBoolean();
    const total_supply_lp = stack.readBigNumber();
    const initial_A = stack.readNumber();
    const initial_A_time = stack.readNumber();
    const future_A = stack.readNumber();
    const future_A_time = stack.readNumber();
    const coins = stack.readTuple();
    const balances = stack.readTuple();
    const collected_admin_fees = stack.readTuple();
    const rates = stack.readTuple();

    return {
      router_address,
      n_coins,
      fee,
      admin_fee_ratio,
      is_initialized,
      total_supply_lp,
      initial_A,
      initial_A_time,
      future_A,
      future_A_time,
      coins: _.times(Number(n_coins)).map(() => coins.readAddress()),
      balances: _.times(Number(n_coins)).map(() => balances.readBigNumber()),
      collected_admin_fees: _.times(Number(n_coins)).map(() =>
        collected_admin_fees.readBigNumber()
      ),
      rates: _.times(Number(n_coins)).map(() => rates.readBigNumber()),
    };
  }

  async getA(provider: ContractProvider): Promise<bigint> {
    const { stack } = await provider.get("A", []);

    return stack.readBigNumber();
  }

  async getJettonData(provider: ContractProvider) {
    const { stack } = await provider.get("get_jetton_data", []);

    return {
      total_supply_lp: stack.readBigNumber(),
      mintable: stack.readNumber(),
      router_address: stack.readAddress(),
      content: stack.readCell(),
      code: stack.readCell(),
    };
  }

  async getWalletAddress(provider: ContractProvider, owner: Address) {
    const { stack } = await provider.get("get_wallet_address", [
      {
        type: "slice",
        cell: beginCell().storeAddress(owner).endCell(),
      },
    ]);

    return stack.readAddress();
  }
}
