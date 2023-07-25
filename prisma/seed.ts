import { PoolType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.coin.createMany({
    data: [
      {
        id: "EQDetVgTEhCuRaT0h1-RGQ4DxVI6rNS9zM8YQ9flw6on1KsW",
        name: "iUSDT",
        symbol: "iUSDT",
        decimals: 6,
        jettonMinter: "EQBD5rI620ZgEU_0Wy-XMb-Zv56lLP2fHhSqSfxEyrs0OCD5",
        image: "https://s2.coinmarketcap.com/static/img/coins/128x128/825.png",
      },
      {
        id: "EQDQVcWiKFMIV4kv98tafibynDJaaNTIbam1rBc8WLrjSLzO",
        name: "iUSDC",
        symbol: "iUSDC",
        decimals: 6,
        jettonMinter: "EQDjuwnrPsmMO3Z9W0r8ftR-ukQD8JI-elJt_xSjd2gV5Vru",
        image: "https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png",
      },
      {
        id: "EQBqYsE3MAG1QzW61qY-dXirHxMMliQI20nxVbYhaL1uhbhT",
        name: "iDAI",
        symbol: "iDAI",
        decimals: 18,
        jettonMinter: "EQDUaOnw_q4b8wdrGtLmX_WmLbvHpmomZZkhxcu2m2Q9r1tN",
        image: "https://s2.coinmarketcap.com/static/img/coins/128x128/4943.png",
      },
      {
        id: "EQC5qBziTUKBpDOhrrg-zdvaJZSfLKl6Bp-GdGF6n2abh8Pf",
        name: "oUSDT",
        symbol: "oUSDT",
        decimals: 6,
        jettonMinter: "EQBb-3wK3bFV7IceStsrOxNYy4bz-wWy2N9C4imNS1BITDZN",
        image:
          "https://raw.githubusercontent.com/orbit-chain/bridge-token-image/main/ton/usdt.png",
      },
      {
        id: "EQB7q5dfTXMDJteiBo3wDfi45w4bZQt-MUkpP3EZg4CZxWy2",
        name: "oWBTC",
        symbol: "oWBTC",
        decimals: 8,
        jettonMinter: "EQBnce2nzsCh1qVE9C4dn73rOLdTnKfGxZvi13U7dcAcOiZH",
        image:
          "https://raw.githubusercontent.com/orbit-chain/bridge-token-image/main/ton/wbtc.png",
      },
      {
        id: "EQCDXnZB8rE-5SK11xw48FRLqGgse4uo93rJDJN9dvTEziw3",
        name: "WTON",
        symbol: "WTON",
        decimals: 9,
        jettonMinter: "EQBC8fG0Fw0FWqiaBkTW68_fN_Z2dxbigq4RkqALpoo_Ak6V",
        image: "https://wton.dev/logo192.png",
      },
      {
        id: "EQAEgTzh4MAAFr35PaeMkOhBgAkqfrj7S1IM-C8yZxGaKtin",
        name: "jWBTC",
        symbol: "jWBTC",
        decimals: 8,
        jettonMinter: "EQBgDWxHz4Q9BkU9IlqaogD-4xc1AVrG1k1qBmrIthB84DYK",
        image:
          "https://bridge.ton.org/token/1/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
      },
    ],
  });

  // All pool token's decimal = 9

  await prisma.pool.createMany({
    data: [
      {
        id: "EQBZrqyG6ppYmjXfukN62AVF4piBaD4vSI0K8mrCfJ2zOksS",
        type: PoolType.STABLE,
        name: "iTripool",
        description: "iUSDT iUSDC iDAI",
        image: "",
        symbol: "ITRIPOOL",
        coins: [
          "EQDQVcWiKFMIV4kv98tafibynDJaaNTIbam1rBc8WLrjSLzO",
          "EQBqYsE3MAG1QzW61qY-dXirHxMMliQI20nxVbYhaL1uhbhT",
          "EQDetVgTEhCuRaT0h1-RGQ4DxVI6rNS9zM8YQ9flw6on1KsW",
        ],
        balances: ["0", "0", "0"],
        rates: ["1000000000000", "1", "1000000000000"],
        collectedAdminFees: ["0", "0", "0"],
        initialA: 5000,
        futureA: 5000,
        initialATime: new Date(),
        futureATime: new Date(),
        fee: 10,
        adminFeeRatio: 50,
        isInitialized: true,
        totalSupply: "0",
      },
      {
        id: "EQCXIb53XnletXuXG3MvwGJquKEzaoKps7bm6V5PXrWYMenc",
        type: PoolType.STABLE,
        name: "btc2",
        description: "oWBTC jWBTC",
        image: "",
        symbol: "IBTCPOOL",
        coins: [
          "EQB7q5dfTXMDJteiBo3wDfi45w4bZQt-MUkpP3EZg4CZxWy2",
          "EQAEgTzh4MAAFr35PaeMkOhBgAkqfrj7S1IM-C8yZxGaKtin",
        ],
        balances: ["0", "0"],
        rates: ["10000000000", "10000000000"],
        collectedAdminFees: ["0", "0"],
        initialA: 2000,
        futureA: 5000,
        initialATime: new Date(),
        futureATime: new Date(),
        fee: 30,
        adminFeeRatio: 40,
        isInitialized: true,
        totalSupply: "12340000",
      },
      {
        id: "EQDUkIRUuXFe0HDF3y1LODmHqLmrPitEZtEDK1XdZWGLDIdT",
        type: PoolType.STABLE,
        name: "usdt2",
        description: "oUSDT iUSDT",
        image: "",
        symbol: "oiUSDT",
        coins: [
          "EQC5qBziTUKBpDOhrrg-zdvaJZSfLKl6Bp-GdGF6n2abh8Pf",
          "EQDetVgTEhCuRaT0h1-RGQ4DxVI6rNS9zM8YQ9flw6on1KsW",
        ],
        balances: ["0", "0"],
        rates: ["1000000000000", "1000000000000"],
        collectedAdminFees: ["0", "0"],
        initialA: 5000,
        futureA: 5000,
        initialATime: new Date(),
        futureATime: new Date(),
        fee: 20,
        adminFeeRatio: 50,
        isInitialized: true,
        totalSupply: "123400000",
      },
      {
        id: "EQAqI55G0lUCPK6y02kodwHfH8kelL6gv-82-zD2Pf1E9Cnn",
        type: PoolType.VOLATILE,
        name: "DAI/TON",
        description: "iDAI WTON",
        image: "",
        symbol: "",
        coins: [
          "EQCDXnZB8rE-5SK11xw48FRLqGgse4uo93rJDJN9dvTEziw3",
          "EQBqYsE3MAG1QzW61qY-dXirHxMMliQI20nxVbYhaL1uhbhT",
        ],
        balances: ["0", "0"],
        rates: [],
        collectedAdminFees: ["0", "0"],
        initialA: 0,
        futureA: 0,
        initialATime: new Date(),
        futureATime: new Date(),
        fee: 20,
        adminFeeRatio: 45,
        isInitialized: true,
        totalSupply: "0",
      },
    ],
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
