import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { User, Loan, PaymentRecord, SMSLogEntry } from '../src/types';
import { INITIAL_USERS } from '../src/services/userService';
import { INITIAL_LOANS } from '../src/data/initialData';
import { recalculateLoanState } from '../src/utils/loanUtils';

// In-memory fallback stores (used when DATABASE_URL is not provided)
let memoryUsers: User[] = [...INITIAL_USERS];
let memoryLoans: Loan[] = [...INITIAL_LOANS];
let memorySMSLogs: SMSLogEntry[] = [];

let pool: Pool | null = null;
let isPostgresReady = false;

// Initialize PostgreSQL connection pool if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    });
    console.log('[Database] Connecting to PostgreSQL instance from DATABASE_URL...');
  } catch (err) {
    console.error('[Database] Failed to create PostgreSQL pool, using in-memory store:', err);
  }
} else {
  console.log('[Database] No DATABASE_URL found. Running with high-performance in-memory persistence.');
}

/**
 * Initialize PostgreSQL tables if connected
 */
export async function initDatabase() {
  if (!pool) return;

  try {
    const client = await pool.connect();
    try {
      console.log('[Database] Running table migration checks on PostgreSQL...');

      // 1. Users Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(64) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(128) NOT NULL,
          role VARCHAR(32) NOT NULL,
          designation VARCHAR(128) NOT NULL,
          email VARCHAR(128),
          phone VARCHAR(32),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMPTZ
        );
      `);

      // 2. Loans Table (JSONB for complex installment schedules and KYC documents)
      await client.query(`
        CREATE TABLE IF NOT EXISTS loans (
          id VARCHAR(64) PRIMARY KEY,
          account_number VARCHAR(64) UNIQUE NOT NULL,
          customer_name VARCHAR(128) NOT NULL,
          customer_phone VARCHAR(32) NOT NULL,
          customer_email VARCHAR(128),
          loan_type VARCHAR(64) NOT NULL,
          requested_amount NUMERIC NOT NULL,
          disbursed_amount NUMERIC NOT NULL,
          interest_rate NUMERIC NOT NULL,
          term_months INT NOT NULL,
          status VARCHAR(64) NOT NULL,
          requested_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Payments Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(64) PRIMARY KEY,
          loan_id VARCHAR(64) REFERENCES loans(id) ON DELETE CASCADE,
          customer_name VARCHAR(128) NOT NULL,
          amount NUMERIC NOT NULL,
          payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          payment_method VARCHAR(64) NOT NULL,
          reference_number VARCHAR(128),
          received_by VARCHAR(128),
          notes TEXT,
          data JSONB
        );
      `);

      // 4. SMS Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sms_logs (
          id VARCHAR(64) PRIMARY KEY,
          recipient VARCHAR(64) NOT NULL,
          message TEXT NOT NULL,
          loan_id VARCHAR(64),
          status VARCHAR(32) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          data JSONB
        );
      `);

      // Seed Initial Users into PostgreSQL if empty
      const userCountRes = await client.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(userCountRes.rows[0].count, 10);
      if (userCount === 0) {
        console.log('[Database] Seeding initial canonical users into PostgreSQL...');
        for (const u of INITIAL_USERS) {
          const rawPass = u.password || (u.username === 'sysadmin' ? 'admin123' : `${u.username}123`);
          const hash = await bcrypt.hash(rawPass, 10);
          await client.query(
            `INSERT INTO users (id, username, password_hash, full_name, role, designation, email, phone, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (username) DO NOTHING`,
            [u.id, u.username, hash, u.fullName, u.role, u.designation, u.email || '', u.phone || '', u.isActive, u.createdAt]
          );
        }
      }

      // Seed Initial Loans into PostgreSQL if empty
      const loanCountRes = await client.query('SELECT COUNT(*) FROM loans');
      const loanCount = parseInt(loanCountRes.rows[0].count, 10);
      if (loanCount === 0) {
        console.log('[Database] Seeding initial sample loans into PostgreSQL...');
        for (const l of INITIAL_LOANS) {
          await client.query(
            `INSERT INTO loans (id, account_number, customer_name, customer_phone, customer_email, loan_type, requested_amount, disbursed_amount, interest_rate, term_months, status, data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [
              l.id,
              l.accountNumber,
              l.customerName,
              l.customerPhone,
              l.customerEmail || '',
              l.loanType,
              l.requestedAmount,
              l.disbursedAmount,
              l.interestRatePerAnnum,
              l.termMonths,
              l.status,
              JSON.stringify(l),
            ]
          );
        }
      }

      isPostgresReady = true;
      console.log('[Database] PostgreSQL database is ready and schema migrated successfully!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Database] Error initializing PostgreSQL database:', err);
    isPostgresReady = false;
  }
}

// -------------------------------------------------------------
// Database Access Operations
// -------------------------------------------------------------

export const db = {
  /**
   * Check if Postgres is active
   */
  isUsingPostgres() {
    return isPostgresReady && pool !== null;
  },

  // -----------------------------------------------------------
  // User Management Methods
  // -----------------------------------------------------------
  async getUsers(): Promise<User[]> {
    if (this.isUsingPostgres()) {
      const res = await pool!.query('SELECT * FROM users ORDER BY created_at ASC');
      return res.rows.map(row => ({
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        role: row.role,
        designation: row.designation,
        email: row.email,
        phone: row.phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        lastLogin: row.last_login,
      }));
    }
    return memoryUsers;
  },

  async getUserByUsername(username: string): Promise<(User & { passwordHash?: string }) | null> {
    if (this.isUsingPostgres()) {
      const res = await pool!.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        role: row.role,
        designation: row.designation,
        email: row.email,
        phone: row.phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        lastLogin: row.last_login,
        passwordHash: row.password_hash,
      };
    }
    const found = memoryUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    return found ? { ...found } : null;
  },

  async createUser(user: User, rawPassword?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const allUsers = await this.getUsers();

    // Check username uniqueness
    if (allUsers.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      return { success: false, error: `Username "${user.username}" is already taken.` };
    }

    // STRICT RULE: Only ONE admin
    if (user.role === 'admin') {
      const adminExists = allUsers.some(u => u.role === 'admin');
      if (adminExists) {
        return { success: false, error: 'Only one Administrator account is permitted. You can assign the Manager role.' };
      }
    }

    if (this.isUsingPostgres()) {
      const hash = await bcrypt.hash(rawPassword || 'User@123', 10);
      await pool!.query(
        `INSERT INTO users (id, username, password_hash, full_name, role, designation, email, phone, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [user.id, user.username, hash, user.fullName, user.role, user.designation, user.email || '', user.phone || '', user.isActive, user.createdAt]
      );
      return { success: true, user };
    }

    const created: User = { ...user, password: rawPassword || 'User@123' };
    memoryUsers.push(created);
    return { success: true, user: created };
  },

  async updateUser(userId: string, updates: Partial<User>, newPassword?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const allUsers = await this.getUsers();
    const target = allUsers.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    // Prevent changing sysadmin username
    if (target.username === 'sysadmin' && updates.username && updates.username !== 'sysadmin') {
      return { success: false, error: 'Primary sysadmin username cannot be altered.' };
    }

    // Single admin rules
    if (updates.role === 'admin' && target.role !== 'admin') {
      const existingAdmin = allUsers.find(u => u.id !== userId && u.role === 'admin');
      if (existingAdmin) {
        return { success: false, error: `Only one Administrator is allowed in the system. "${existingAdmin.fullName}" is currently the Administrator.` };
      }
    }

    if (target.role === 'admin') {
      if (updates.role && updates.role !== 'admin') {
        return { success: false, error: 'Cannot demote the primary Administrator account.' };
      }
      if (updates.isActive === false) {
        return { success: false, error: 'The primary Administrator account cannot be deactivated.' };
      }
    }

    if (this.isUsingPostgres()) {
      let passwordQuery = '';
      const params: any[] = [
        updates.fullName ?? target.fullName,
        updates.role ?? target.role,
        updates.designation ?? target.designation,
        updates.email ?? target.email,
        updates.phone ?? target.phone,
        updates.isActive ?? target.isActive,
        userId,
      ];

      if (newPassword) {
        const hash = await bcrypt.hash(newPassword, 10);
        params.unshift(hash);
        passwordQuery = 'password_hash = $1, ';
      }

      await pool!.query(
        `UPDATE users SET 
          ${passwordQuery}
          full_name = $${newPassword ? 2 : 1},
          role = $${newPassword ? 3 : 2},
          designation = $${newPassword ? 4 : 3},
          email = $${newPassword ? 5 : 4},
          phone = $${newPassword ? 6 : 5},
          is_active = $${newPassword ? 7 : 6}
         WHERE id = $${newPassword ? 8 : 7}`,
        params
      );

      const updated = (await this.getUsers()).find(u => u.id === userId);
      return { success: true, user: updated };
    }

    const index = memoryUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      memoryUsers[index] = {
        ...memoryUsers[index],
        ...updates,
        ...(newPassword ? { password: newPassword } : {}),
      };
      return { success: true, user: memoryUsers[index] };
    }
    return { success: false, error: 'Update failed.' };
  },

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const allUsers = await this.getUsers();
    const target = allUsers.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    if (target.role === 'admin' || target.username === 'sysadmin') {
      return { success: false, error: 'Primary Administrator cannot be deleted.' };
    }

    if (this.isUsingPostgres()) {
      await pool!.query('DELETE FROM users WHERE id = $1', [userId]);
      return { success: true };
    }

    memoryUsers = memoryUsers.filter(u => u.id !== userId);
    return { success: true };
  },

  async resetUsersToDefaults(): Promise<User[]> {
    if (this.isUsingPostgres()) {
      await pool!.query('DELETE FROM users');
      for (const u of INITIAL_USERS) {
        const hash = await bcrypt.hash(u.password || 'admin123', 10);
        await pool!.query(
          `INSERT INTO users (id, username, password_hash, full_name, role, designation, email, phone, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [u.id, u.username, hash, u.fullName, u.role, u.designation, u.email || '', u.phone || '', u.isActive, u.createdAt]
        );
      }
      return this.getUsers();
    }
    memoryUsers = [...INITIAL_USERS];
    return memoryUsers;
  },

  // -----------------------------------------------------------
  // Loans Management Methods
  // -----------------------------------------------------------
  async getLoans(): Promise<Loan[]> {
    if (this.isUsingPostgres()) {
      const res = await pool!.query('SELECT data FROM loans ORDER BY requested_date DESC');
      return res.rows.map(row => recalculateLoanState(row.data as Loan));
    }
    return memoryLoans.map(recalculateLoanState);
  },

  async getLoanById(id: string): Promise<Loan | null> {
    if (this.isUsingPostgres()) {
      const res = await pool!.query('SELECT data FROM loans WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      return recalculateLoanState(res.rows[0].data as Loan);
    }
    const found = memoryLoans.find(l => l.id === id);
    return found ? recalculateLoanState(found) : null;
  },

  async saveLoan(loan: Loan): Promise<Loan> {
    const calculated = recalculateLoanState(loan);
    if (this.isUsingPostgres()) {
      await pool!.query(
        `INSERT INTO loans (id, account_number, customer_name, customer_phone, customer_email, loan_type, requested_amount, disbursed_amount, interest_rate, term_months, status, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           customer_name = EXCLUDED.customer_name,
           customer_phone = EXCLUDED.customer_phone,
           customer_email = EXCLUDED.customer_email,
           status = EXCLUDED.status,
           disbursed_amount = EXCLUDED.disbursed_amount,
           data = EXCLUDED.data,
           updated_at = CURRENT_TIMESTAMP`,
        [
          calculated.id,
          calculated.accountNumber,
          calculated.customerName,
          calculated.customerPhone,
          calculated.customerEmail || '',
          calculated.loanType,
          calculated.requestedAmount,
          calculated.disbursedAmount,
          calculated.interestRatePerAnnum,
          calculated.termMonths,
          calculated.status,
          JSON.stringify(calculated),
        ]
      );
      return calculated;
    }

    const idx = memoryLoans.findIndex(l => l.id === calculated.id);
    if (idx >= 0) {
      memoryLoans[idx] = calculated;
    } else {
      memoryLoans.unshift(calculated);
    }
    return calculated;
  },

  async deleteLoan(id: string): Promise<boolean> {
    if (this.isUsingPostgres()) {
      const res = await pool!.query('DELETE FROM loans WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const prevLen = memoryLoans.length;
    memoryLoans = memoryLoans.filter(l => l.id !== id);
    return memoryLoans.length < prevLen;
  },

  // -----------------------------------------------------------
  // SMS Logs Methods
  // -----------------------------------------------------------
  async getSMSLogs(): Promise<SMSLogEntry[]> {
    if (this.isUsingPostgres()) {
      const res = await pool!.query('SELECT data FROM sms_logs ORDER BY created_at DESC LIMIT 200');
      return res.rows.map(r => r.data as SMSLogEntry);
    }
    return memorySMSLogs;
  },

  async addSMSLog(log: SMSLogEntry): Promise<void> {
    if (this.isUsingPostgres()) {
      await pool!.query(
        `INSERT INTO sms_logs (id, recipient, message, loan_id, status, data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [log.id, log.recipient, log.message, log.loanId || null, log.status, JSON.stringify(log)]
      );
      return;
    }
    memorySMSLogs.unshift(log);
    if (memorySMSLogs.length > 200) memorySMSLogs.pop();
  },
};
