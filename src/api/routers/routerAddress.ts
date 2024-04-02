import { Router } from "express";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const ROUTER_ADDRESS_CLMM = process.env.ROUTER_ADDRESS_CLMM;
router.get("/router-address", async function handler(req, res) {
  return res.json(ROUTER_ADDRESS);
});

router.get("/router-address_clmm", async function handler(req, res) {
  return res.json(ROUTER_ADDRESS_CLMM);
});

export default router;
