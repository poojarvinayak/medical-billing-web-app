import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { User } from '../models/User.js'

const seedAdmin = async (): Promise<void> => {
  const name = process.env.ADMIN_NAME
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD
  if (!name || !email || !password) throw new Error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required')
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters')
  await connectDatabase(env.mongodbUri)
  const existing = await User.findOne({ email })
  if (existing) { console.log('Admin user already exists; no duplicate was created'); return }
  await User.create({ name, email, password, role: 'ADMIN', isActive: true })
  console.log(`Admin user created for ${email}. Change the development password before production use.`)
}

seedAdmin().catch((error: unknown) => { console.error('Admin seed failed:', error instanceof Error ? error.message : 'Unknown error'); process.exitCode = 1 }).finally(async () => { await mongoose.disconnect() })
