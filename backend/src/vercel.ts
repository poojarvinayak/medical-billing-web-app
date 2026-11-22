import 'dotenv/config'
import mongoose from 'mongoose'
import type { Request, Response } from 'express'
import { createApp } from './app.js'
import { env } from './config/env.js'

let databaseReady: Promise<void> | null = null
const app = createApp(env.corsOrigin)

export default async function handler(request: Request, response: Response) {
  if (mongoose.connection.readyState !== 1) {
    databaseReady ??= mongoose.connect(env.mongodbUri).then(() => undefined)
    await databaseReady
  }
  return app(request as never, response as never)
}
