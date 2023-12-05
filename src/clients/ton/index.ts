import { TonClient4 } from "@ton/ton";

const ton = new TonClient4({
  endpoint: process.env.TON_HUB_API_URL || "",
});

export default ton;
