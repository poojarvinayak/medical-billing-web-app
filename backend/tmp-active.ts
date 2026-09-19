import mongoose from 'mongoose'
import { Medicine } from './src/models/Medicine.js'

const run = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/medical-store-billing')
  const meds = await Medicine.find({ isActive: true }, { name: 1, stockQuantity: 1, batchNumber: 1, expiryDate: 1, mrp: 1, sellingPrice: 1, gstPercentage: 1 }).lean()
  console.log(JSON.stringify(meds, null, 2))
  await mongoose.disconnect()
}
run().catch((error) => { console.error(error); process.exit(1) })
