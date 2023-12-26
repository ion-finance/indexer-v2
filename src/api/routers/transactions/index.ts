import { Router } from "express";
const router = Router();

router.get("/accounts/:address/history", async function handler(req, res) {
  /*
  const address = req.params.address;

  const [deposit, withdraw, swap] = await Promise.all([
    prisma.depositedToBins.findMany({ where: { senderAddress: address } }),
    prisma.withdrawnFromBins.findMany({ where: { senderAddress: address } }),
    prisma.swap.findMany({ where: { senderAddress: address } }),
  ]);

  return res.json({
    deposit,
    withdraw,
    swap,
  });
  */

  return res.json({
    deposit: [
      {
        id: "395a8f0f33ef97d67e2b17114bfd3007dbca6f5f915f7a975ba8bfe9ec015117",
        createdAt: "2023-12-20 10:00:27.451",
        timestamp: 1701863435,
        tokenAddress: "EQBDjGFi2J4uEvqHI66qX_PA5M2T0yHzdKnLDThoHLUdgcGH",
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        deposited: [
          { binId: 8388604, amount: "10000000" },
          { binId: 8388605, amount: "10000000" },
          { binId: 8388606, amount: "10000000" },
          { binId: 8388607, amount: "10000000" },
          { binId: 8388608, amount: "10000000" },
        ],
      },
    ],
    withdraw: [
      {
        id: "9f29502d94e83da176f7bab3d242902a4af212dc53c01e15673954f3a5a87229",
        createdAt: "2023-12-21 10:00:27.451",
        timestamp: 1701865435,
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        withdrawn: [
          { binId: 8388604, amount: "10000000" },
          { binId: 8388605, amount: "10000000" },
          { binId: 8388606, amount: "10000000" },
          { binId: 8388607, amount: "10000000" },
          { binId: 8388608, amount: "10000000" },
        ],
      },
    ],
    swap: [
      {
        id: "395f12454c0910b25a39ced728ac296f51f79c786f9322074dd54801af59f904",
        timestamp: 1701865435,
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        amountIn: "10000000",
        amountOut: "10000000",
        swapForY: true,
      },
      {
        id: "7b066c7c1186bfa897854f0afbf0c1484cdad5b6b0a7063ef5f5b78ce4d066f0",
        timestamp: 1701866435,
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBMBZEQqVl4KVaAp_",
        amountIn: "10000000",
        amountOut: "10000000",
        swapForY: false,
      },
    ],
  });
});

export default router;
