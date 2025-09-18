// app/api/test-db/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    return NextResponse.json({ success: true, result: rows[0].result });
  } catch (err) {
    console.error('DB test error:', err);
    return NextResponse.json({ error: 'DB connection failed' }, { status: 500 });
  }
}
