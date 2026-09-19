import { createApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase(env.mongodbUri)
    const app = createApp(env.corsOrigin)
    app.listen(env.port, () => {
      console.log(`Medical Store Billing API listening on port ${env.port}`)
      console.log(`Environment: ${env.nodeEnv}`)
    })
  } catch (error) {
    console.error('Unable to start server because MongoDB connection failed:', error)
    process.exit(1)
  }
}

void startServer()
