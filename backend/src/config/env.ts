import 'dotenv/config'

const required = (value: string | undefined, fallback?: string): string => {
  if (value) return value
  if (fallback !== undefined) return fallback
  throw new Error('Required environment variable is missing')
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: required(process.env.MONGODB_URI),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: required(process.env.JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
}
