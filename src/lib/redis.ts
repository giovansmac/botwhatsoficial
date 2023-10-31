import { Redis } from "ioredis"

import { config } from "../config"

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
})

export const redisset = new Redis({
  host: 'redis-15132.c1.us-east1-2.gce.cloud.redislabs.com',
  port: 15132,
  username:'default',
  password:'iQGztgpySPZ6mmProyFVe4VSPZLvQlZv'
})