import { Router } from "express";
import prisma from "../../../clients/prisma";
import { formatUnits } from "ethers";
import calcAmountsFromPosition from "../../../utils/calcAmountsFromPosition";
import jwt from "jsonwebtoken";
import { Bot } from "grammy";
import { OrderType } from "@prisma/client";
import { getBinPrice } from "../../../utils/binMath";
import _ from "lodash";

const router = Router();
export const bot = new Bot(process.env.BOT_TOKEN as string);

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact" });
const usdFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  style: "currency",
  currency: "USD",
});

const getUser = (token: string) => {
  let user: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    language_code: string;
    iat: number;
    exp: number;
  } | null = null;

  try {
    user = jwt.verify(token, process.env.JWT_SECRET as string) as any;
  } catch (error) {
    console.log("jwt error");
    return null;
  }

  return user;
};

router.get("/bot/positions", async function handler(req, res) {
  let { address, token } = req.query;

  if (!address || !token) {
    return res.json({
      status: "bad request",
      data: [],
    });
  }

  address = address as string;
  token = token as string;

  const user = getUser(token);

  if (!user) {
    return res.status(401).json({ status: "unauthorized" });
  }

  // TODO : Check jwt
  const [tokens, pools, lpTokenWallets, bins] = await Promise.all([
    prisma.token.findMany(),
    prisma.pool.findMany(),
    prisma.lpTokenWallet.findMany({
      where: {
        ownerAddress: address,
      },
    }),
    prisma.bins.findMany(),
  ]);

  if (lpTokenWallets.length === 0) {
    return res.json({});
  }
  let msg = "*Positions*\n=== Existing Liquidity Positions ===\n";

  lpTokenWallets.map((lpTokenWallet, index) => {
    const pool = pools.find((pool) => pool.id === lpTokenWallet.poolAddress);
    if (!pool) return;
    const tokenX = tokens.find((token) => token.id === pool.tokenXAddress);
    const tokenY = tokens.find((token) => token.id === pool.tokenYAddress);
    const poolBins = bins.filter((bin) => bin.poolAddress === pool.id);
    if (!tokenX || !tokenY) return;

    const amounts = calcAmountsFromPosition(
      poolBins,
      lpTokenWallet.shares as { binId: number; amount: number }[],
      pool.binStep
    );
    const balanceX = parseFloat(
      formatUnits(
        amounts.reduce((acc, amount) => acc + amount.amountX, BigInt(0)),
        tokenX.decimals
      )
    );
    const balanceY = parseFloat(
      formatUnits(
        amounts.reduce((acc, amount) => acc + amount.amountY, BigInt(0)),
        tokenY.decimals
      )
    );

    msg += `${index + 1}. ${pool.name} ${
      tokenX.symbol
    }: ${compactFormatter.format(balanceX)} ${
      tokenY.symbol
    }: ${compactFormatter.format(balanceY)} Value: ${usdFormatter.format(
      balanceX + balanceY
    )} Fees: $0\n`;
  });

  await bot.api.sendMessage(user.id, msg, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Portfolio",
            web_app: { url: process.env.BASE_LINK + "/portfolio" },
          },
        ],
      ],
    },
  });

  return res.status(200).json({});
});

router.get("/bot/orders", async function handler(req, res) {
  let { address, token } = req.query;

  if (!address || !token) {
    return res.json({
      status: "bad request",
      data: [],
    });
  }

  address = address as string;
  token = token as string;

  const user = getUser(token);

  if (!user) {
    return res.status(401).json({ status: "unauthorized" });
  }

  // TODO : Check jwt
  const [tokens, pools, orders] = await Promise.all([
    prisma.token.findMany(),
    prisma.pool.findMany(),
    prisma.order.findMany({
      where: { ownerAddress: address, status: { in: [OrderType.PLACED] } },
    }),
  ]);

  if (orders.length === 0) {
    return res.json({});
  }
  let msg = "*Orders*\n=== Existing Orders ===\n";

  _.sortBy(orders, ["timestamp"], ["asc"]).map((order, index) => {
    const pool = pools.find((pool) => pool.id === order.poolAddress);
    if (!pool) return;
    const tokenX = tokens.find((token) => token.id === pool.tokenXAddress);
    const tokenY = tokens.find((token) => token.id === pool.tokenYAddress);
    if (!tokenX || !tokenY) return;

    const amountIn = order.orderForY ? order.amountX : order.amountY;
    const tokenIn = order.orderForY ? tokenX : tokenY;
    const poolAddress = `${pool.id.slice(0, 4)}...${pool.id.slice(-4)}`;
    const price = getBinPrice(pool.binStep, order.binId - 2 ** 23); // priceYX

    // TODO check amountIn & usd value
    msg += `${index + 1}. ${
      pool.name
    }(${poolAddress}) Amount: ${compactFormatter.format(
      parseFloat(formatUnits(amountIn, tokenIn.decimals))
    )} ${tokenIn.symbol} | Limit: ${usdFormatter.format(price)}\n`;
  });

  await bot.api.sendMessage(user.id, msg, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Cancel order",
            web_app: { url: process.env.BASE_LINK + "/portfolio" },
          },
        ],
      ],
    },
  });

  return res.status(200).json({});
});

export default router;
