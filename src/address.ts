import dotenv from 'dotenv'
dotenv.config()

const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || ''
const ROUTER_ADDRESS_CLMM = process.env.ROUTER_ADDRESS_CLMM || ''
const IS_CLMM = process.env.IS_CLMM === 'true'

export const routerAddress = IS_CLMM ? ROUTER_ADDRESS_CLMM : ROUTER_ADDRESS
