import type { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error)
  const statusCode = typeof error?.statusCode === 'number' && error.statusCode >= 400 && error.statusCode <= 599 ? error.statusCode : 500
  const message = (statusCode < 500 || statusCode === 503) && error instanceof Error ? error.message : 'Internal server error'
  response.status(statusCode).json({ success: false, message })
}
