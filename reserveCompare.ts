import axios, { AxiosResponse } from 'axios'
import { formatUnits } from 'ethers';
import dotenv from "dotenv";

dotenv.config()

type ServerPool = { reserveX: string; reserveY: string; name: string; id: string; tokenX: { id: string; }; tokenY: { id: string; }; }
type ContractPool = {decoded: { reserve0:string, reserve1:string,  token0_address:string, token1_address:string}}

async  function compareReserve() {
    const res = await  axios.get<ServerPool[]>(`https://api.app.ionfi.xyz/pools`)
    const serverPools = res.data.map((p) => {
        return {
        reserve0: formatUnits(BigInt(p?.reserveX || '0'),9),
        reserve1: formatUnits(BigInt(p?.reserveY || '0'),9),
        name: p.name,
        poolId: p.id,
        tokenX: p.tokenX.id,
        tokenY: p.tokenY.id,
        }
    })

    const promisePools = serverPools.map((p: { poolId: string; }) => {
        return axios.get(`${process.env.TON_API_URL}/blockchain/accounts/${p.poolId}/methods/get_pool_data`,{
            headers: {
                Authorization: `Bearer ${process.env.TON_API_KEY}`,
                'Content-type': 'application/json',
                },
            })
        })
    let contractPools: {reserve0:string, reserve1: string, tokenX:string, tokenY:string}[] | undefined;

    await Promise.allSettled(promisePools)
        .then((res) => {
            const successPools = res.filter((value) => {
                return value.status !== 'rejected'
            }) as PromiseFulfilledResult<AxiosResponse<ContractPool, unknown>>[]
        contractPools =  successPools.map((pool) => {
            return {
                reserve0: formatUnits(BigInt(pool?.value.data.decoded.reserve0 || '0'),9),
                reserve1:  formatUnits(BigInt(pool?.value.data.decoded.reserve1 || '0'),9),
                tokenX: pool.value.data.decoded.token0_address,
                tokenY: pool.value.data.decoded.token1_address
                }
            })  
        serverPools.forEach((pool,index) => {
            if(!contractPools)return
            console.log(`${pool.name} (server reserve / contract reserve)`)
            console.log(`reserve0: ${pool.reserve0} / ${contractPools[index].reserve0}`)
            console.log(`reserve1: ${pool.reserve1} / ${contractPools[index].reserve1}`)
            console.log(`isSameReserve0: ${pool.reserve0 === contractPools[index].reserve0}, isSameReserve1: ${pool.reserve1 === contractPools[index].reserve1}`)
            console.log("")
        })
    })
}

compareReserve();

