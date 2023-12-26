import { Router } from "express";
const router = Router();

// TODO
// 1. calc balances usd
// 2. remove mock data
router.get("/positions/:address", async function handler(req, res) {
  const address = req.params.address;

  /*
    const lpTokenWallets = await prisma.lpTokenWallet.findMany({
      where: {
        ownerAddress: address,
      },
    });

    return res.json(lpTokenWallets);
    */

  // Mock data
  return res.json({
    summary: {
      balanceUsd: "100000",
      earnedUsd: "0",
    },
    positions: [
      {
        poolAddress: "EQDeFZXkU2eMz8PRSkt6tEJaQgV2WU2BBM1BZEQqVl4KVaAp_",
        ownerAddress: address,
        amounts: [
          { binId: 8388606, amount: "4000000" },
          { binId: 8388607, amount: "4000000" },
          { binId: 8388608, amount: "2000000" },
        ],
        feeUsd: "0",
        balanceUsd: "100000",
      },
    ],
  });
});

export default router;
