import { ValidationError } from 'apollo-server-core'

const handleCastError = (error: any) => {
  const message = `Invalid ${error.path}: ${error.value}`
  throw new ValidationError(message)
}

const handleValidationError = (error: any) => {
  const message = Object.values(error.errors).map((el: any) => el.message)
  throw new ValidationError(`Invalid input: ${message.join(', ')}`)
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const errorHandler = (err: any): never => {
  if (err.name === 'CastError') handleCastError(err)
  if (err.name === 'ValidationError') handleValidationError(err)
  throw err
}

export default errorHandler
