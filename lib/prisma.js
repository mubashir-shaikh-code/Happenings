// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// 🔧 Summary Purpose:
// Avoid multiple PrismaClient instances (which can crash app in development).
// Centralized singleton pattern for Prisma.
// Easy import: import prisma from '@/lib/prisma'
// Ye performance aur stability dono ke liye best practice hai.