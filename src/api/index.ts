import express from "express";
import poolRouter from "./routers/pools";
import positionRouter from "./routers/positions";
import tokenRouter from "./routers/tokens";
import transactionRouter from "./routers/transactions";
import binRouter from "./routers/bins";
import orderRouter from "./routers/orders";
import taskRouter from "./routers/tasks";
import cors from "cors";

const api = express();

api.use(cors());
api.use(poolRouter);
api.use(positionRouter);
api.use(tokenRouter);
api.use(transactionRouter);
api.use(binRouter);
api.use(orderRouter);
api.use(taskRouter);

export default api;