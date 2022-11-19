import mongoose from 'mongoose'
import config from 'config'

// const localUri = config.get<string>('dbUri')

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb://admin:admin@localhost:6000/askme?authSource=admin')
    console.log('? Database connected successfully')
  } catch (error: any) {
    console.log(error)
    setTimeout(connectDB, 5000)
  }
}

export default connectDB
