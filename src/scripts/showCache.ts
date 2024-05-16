import getRedisClient, { getEventSummary } from 'src/redisClient'

const showCache = async () => {
  const redisClient = getRedisClient()
  const eventIds = await getEventSummary(0, -1)
  console.log('eventIds', eventIds)

  const keys = await redisClient.keys('*')
  console.log('keys', keys)
  redisClient.quit()
  console.log('Redis Client Quit.')
}

showCache()
