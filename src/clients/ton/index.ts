import { TonClient4 } from "ton";

// TODO Add mainnet
const ton = new TonClient4({
  endpoint: "https://sandbox-v4.tonhubapi.com",
});

export default ton;
