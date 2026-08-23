import { User, UserRole } from '../types';

const USERS_STORAGE_KEY = 'smv_holdings_users_v2';
const SESSION_STORAGE_KEY = 'smv_holdings_current_session_v2';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'sysadmin',
    password: 'admin123',
    fullName: 'System Administrator',
    role: 'admin',
    designation: 'Principal IT & System Administrator',
    email: 'admin@smvholdings.lk',
    phone: '0770001111',
    isActive: true,
    createdAt: '2026-01-01',
    lastLogin: '2026-08-23 09:30 AM',
  },
  {
    id: 'USR-002',
    username: 'manager1',
    password: 'manager123',
    fullName: 'Sarah Jayawardena',
    role: 'manager',
    designation: 'Branch Credit Manager',
    email: 'sarah.j@smvholdings.lk',
    phone: '0771234567',
    isActive: true,
    createdAt: '2026-01-15',
    lastLogin: '2026-08-23 08:15 AM',
  },
  {
    id: 'USR-003',
    username: 'staff1',
    password: 'staff123',
    fullName: 'Kasun Perera',
    role: 'staff',
    designation: 'Loan & Cashier Officer',
    email: 'kasun.p@smvholdings.lk',
    phone: '0719876543',
    isActive: true,
    createdAt: '2026-02-01',
    lastLogin: '2026-08-23 07:45 AM',
  },
];

export const userService = {
  /**
   * Fetch all registered users from storage
   */
  getUsers(): User[] {
    try {
      // Also clean up legacy v1 storage if present to remove test accounts
      if (localStorage.getItem('smv_holdings_users_v1')) {
        localStorage.removeItem('smv_holdings_users_v1');
      }

      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      const parsed: User[] = JSON.parse(stored);
      
      // Ensure the original sysadmin exists and is the sole admin
      const hasSysAdmin = parsed.some(u => u.username.toLowerCase() === 'sysadmin');
      let cleaned = parsed;
      if (!hasSysAdmin) {
        cleaned = [INITIAL_USERS[0], ...parsed];
      }

      // Filter out any other admin accounts that were created during testing
      // Strictly keep only the original sysadmin as admin
      cleaned = cleaned.filter(u => {
        if (u.role === 'admin' && u.username.toLowerCase() !== 'sysadmin') {
          // Remove test admin accounts
          return false;
        }
        return true;
      });

      // Save sanitized list if changes were made
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cleaned));
      }

      return cleaned;
    } catch {
      return INITIAL_USERS;
    }
  },

  /**
   * Reset user database back to original defaults (sysadmin, manager1, staff1)
   */
  resetToDefaults(): User[] {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  /**
   * Save user list to storage
   */
  saveUsers(users: User[]) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  },

  /**
   * Get currently logged-in user session
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        // Verify user is still active in users list
        const allUsers = this.getUsers();
        const found = allUsers.find(u => u.id === user.id);
        if (found && found.isActive) {
          return found;
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Set current logged-in user
   */
  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  },

  /**
   * Authenticate user by username and password
   */
  login(username: string, password: string): { success: boolean; error?: string; user?: User } {
    const trimmedUser = username.trim().toLowerCase();
    const allUsers = this.getUsers();
    
    const user = allUsers.find(u => u.username.toLowerCase() === trimmedUser);

    if (!user) {
      return { success: false, error: 'Invalid username. Please check and try again.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'This user account has been deactivated. Please contact your System Administrator.' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Update last login timestamp
    const nowStr = new Date().toLocaleString('en-LK', { dateStyle: 'short', timeStyle: 'short' });
    const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, lastLogin: nowStr } : u);
    this.saveUsers(updatedUsers);

    const loggedInUser = { ...user, lastLogin: nowStr };
    this.setCurrentUser(loggedInUser);

    return { success: true, user: loggedInUser };
  },

  /**
   * Logout user
   */
  logout() {
    this.setCurrentUser(null);
  },

  /**
   * Create a new user (Admin / Manager only)
   */
  createUser(data: {
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
    designation: string;
    email?: string;
    phone?: string;
  }): { success: boolean; error?: string; user?: User } {
    const trimmedUser = data.username.trim().toLowerCase();
    if (!trimmedUser || !data.password || !data.fullName) {
      return { success: false, error: 'Username, password, and full name are required.' };
    }

    const users = this.getUsers();
    if (users.some(u => u.username.toLowerCase() === trimmedUser)) {
      return { success: false, error: `Username "${data.username}" is already taken.` };
    }

    // STRICT RULE: There can be ONLY ONE admin role account
    if (data.role === 'admin') {
      const existingAdmin = users.find(u => u.role === 'admin');
      if (existingAdmin) {
        return { 
          success: false, 
          error: `Only one Administrator account is permitted in the system. Currently, "${existingAdmin.fullName}" (@${existingAdmin.username}) is the sole Administrator. You can assign the "Manager" role instead for administrative access.` 
        };
      }
    }

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: trimmedUser,
      password: data.password,
      fullName: data.fullName.trim(),
      role: data.role,
      designation: data.designation.trim() || (data.role === 'admin' ? 'Administrator' : data.role === 'manager' ? 'Branch Manager' : 'Staff Officer'),
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newUser, ...users];
    this.saveUsers(updated);

    return { success: true, user: newUser };
  },

  /**
   * Update an existing user
   */
  updateUser(userId: string, updates: Partial<User>): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      return { success: false, error: 'User not found.' };
    }

    const currentUser = users[index];

    // Protect sysadmin username
    if (currentUser.username === 'sysadmin' && updates.username && updates.username !== 'sysadmin') {
      return { success: false, error: 'The primary sysadmin username cannot be altered.' };
    }

    // STRICT RULE: If assigning admin role, ensure no OTHER user is already admin
    if (updates.role === 'admin' && currentUser.role !== 'admin') {
      const existingAdmin = users.find(u => u.id !== userId && u.role === 'admin');
      if (existingAdmin) {
        return { 
          success: false, 
          error: `Only one Administrator account is permitted in the system. "${existingAdmin.fullName}" (@${existingAdmin.username}) is currently the sole Administrator.` 
        };
      }
    }

    // STRICT RULE: Cannot demote the ONLY admin or deactivate the admin
    if (currentUser.role === 'admin') {
      if (updates.role && updates.role !== 'admin') {
        return { 
          success: false, 
          error: 'The system must always have exactly one Administrator account. To designate another user, assign the Manager role.' 
        };
      }
      if (updates.isActive === false) {
        return { 
          success: false, 
          error: 'The primary Administrator account cannot be deactivated.' 
        };
      }
    }

    // Check if new username collides with another user
    if (updates.username && updates.username.toLowerCase() !== currentUser.username.toLowerCase()) {
      if (users.some(u => u.id !== userId && u.username.toLowerCase() === updates.username!.toLowerCase())) {
        return { success: false, error: `Username "${updates.username}" is already in use.` };
      }
    }

    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);

    return { success: true };
  },

  /**
   * Delete a user (cannot delete the admin)
   */
  deleteUser(userId: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, error: 'User not found.' };
    }

    if (target.role === 'admin' || target.username === 'sysadmin') {
      return { success: false, error: 'The primary Administrator account cannot be deleted.' };
    }

    const updated = users.filter(u => u.id !== userId);
    this.saveUsers(updated);

    return { success: true };
  },

  /**
   * Get the single active Administrator user
   */
  getAdminUser(): User | undefined {
    return this.getUsers().find(u => u.role === 'admin');
  },

  /**
   * Check if an Administrator account exists
   */
  hasAdmin(): boolean {
    return this.getUsers().some(u => u.role === 'admin');
  },

  /**
   * Role permissions checks:
   * - admin: All access + user management + loan approvals + dashboard
   * - manager: All access + user management + loan approvals + dashboard (same rights as admin)
   * - staff: can only create new payments, loan applications, early settlements, kyc repository, payments.
   *          Cannot approve loans, cannot access dashboard, cannot access user management.
   */
  canAccessDashboard(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
  },

  canApproveLoans(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
  },

  canManageUsers(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
  },

  canViewReports(role: UserRole): boolean {
    return role === 'admin' || role === 'manager';
  },
};
