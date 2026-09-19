import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import healthRouter from './routes/health.routes.js'
import authRouter from './routes/auth.routes.js'
import medicineRouter from './routes/medicine.routes.js'
import customerRouter from './routes/customer.routes.js'
import billingRouter from './routes/billing.routes.js'
import saleRouter from './routes/sale.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export const createApp = (corsOrigin: string) => {
  const app = express()
  const corsOptions = process.env.NODE_ENV === 'production'
    ? { origin: [corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }
    : { origin: true, credentials: true }
  app.use(cors(corsOptions))
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/medicines', medicineRouter)
  app.use('/api/customers', customerRouter)
  app.use('/api/billing', billingRouter)
  app.use('/api/sales', saleRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use(errorHandler)
  return app
}
