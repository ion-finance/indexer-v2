import getRedisClient, { getRouterTxsFromCache } from 'src/redisClient'

const showCache = async () => {
  const redisClient = getRedisClient()
  if (!redisClient) {
    console.error('Empty redis client')
    return null
  }
  const routerTxs = await getRouterTxsFromCache(0, -1)
  console.log('routerTxs', routerTxs)

  const keys = await redisClient.keys('*')
  console.log('keys', keys)
  redisClient.quit()
  console.log('Redis Client Quit.')
}

showCache()
