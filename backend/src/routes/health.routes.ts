import { Router } from 'express'

const healthRouter = Router()

healthRouter.get('/', (_request, response) => {
  response.json({ success: true, message: 'Medical Store Billing API is running' })
})

export default healthRouter
