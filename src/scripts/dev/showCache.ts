import getRedisClient, { getEventSummary } from 'src/redisClient'

const showCache = async () => {
  const redisClient = getRedisClient()
  if (!redisClient) {
    console.error('Empty redis client')
    return null
  }
  const events = await getEventSummary(0, -1)
  console.log('events', events)

  const keys = await redisClient.keys('*')
  console.log('keys', keys)
  redisClient.quit()
  console.log('Redis Client Quit.')
}

showCache()