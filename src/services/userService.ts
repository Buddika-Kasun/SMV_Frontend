import axios from 'axios';
import { User, UserRole } from '../types';

const USERS_STORAGE_KEY = 'smv_holdings_users_v2';
const SESSION_STORAGE_KEY = 'smv_holdings_current_session_v2';
const AUTH_TOKEN_KEY = 'auth_token';

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
   * Fetch all registered users from backend or local fallback
   */
  async fetchUsersFromBackend(): Promise<User[]> {
    try {
      const response = await axios.get<{ success: boolean; users: User[] }>('/api/users');
      if (response.data && response.data.users) {
        this.saveUsers(response.data.users);
        return response.data.users;
      }
    } catch (err) {
      console.warn('[User Service] Backend fetch failed, using local storage:', err);
    }
    return this.getUsers();
  },

  /**
   * Fetch all registered users from storage
   */
  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      const parsed: User[] = JSON.parse(stored);
      
      const hasSysAdmin = parsed.some(u => u.username.toLowerCase() === 'sysadmin');
      let cleaned = parsed;
      if (!hasSysAdmin) {
        cleaned = [INITIAL_USERS[0], ...parsed];
      }

      // Filter out any extra admin accounts: strictly keep only sysadmin
      cleaned = cleaned.filter(u => {
        if (u.role === 'admin' && u.username.toLowerCase() !== 'sysadmin') {
          return false;
        }
        return true;
      });

      if (cleaned.length !== parsed.length) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cleaned));
      }

      return cleaned;
    } catch {
      return INITIAL_USERS;
    }
  },

  /**
   * Reset user database back to original defaults
   */
  async resetToDefaults(): Promise<User[]> {
    try {
      await axios.post('/api/users/reset-defaults');
    } catch {
      // ignore
    }
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
  setCurrentUser(user: User | null, token?: string) {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  /**
   * Authenticate user by username and password (tries backend then local)
   */
  async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const trimmedUser = username.trim().toLowerCase();

    // 1. Attempt Backend Auth
    try {
      const response = await axios.post<{ success: boolean; token: string; user: User; message?: string }>('/api/auth/login', {
        username: trimmedUser,
        password,
      });

      if (response.data.success && response.data.user) {
        this.setCurrentUser(response.data.user, response.data.token);
        return { success: true, user: response.data.user };
      }
    } catch (apiErr: any) {
      const errorMsg = apiErr.response?.data?.error;
      if (errorMsg && (errorMsg.includes('password') || errorMsg.includes('deactivated') || errorMsg.includes('Invalid'))) {
        return { success: false, error: errorMsg };
      }
    }

    // 2. Local Fallback Auth
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
  async createUser(data: {
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
    designation: string;
    email?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> {
    const trimmedUser = data.username.trim().toLowerCase();
    if (!trimmedUser || !data.password || !data.fullName) {
      return { success: false, error: 'Username, password, and full name are required.' };
    }

    // Attempt backend creation
    try {
      const response = await axios.post<{ success: boolean; user: User; error?: string }>('/api/users', data);
      if (response.data.success && response.data.user) {
        const users = this.getUsers();
        const updated = [response.data.user, ...users.filter(u => u.id !== response.data.user.id)];
        this.saveUsers(updated);
        return { success: true, user: response.data.user };
      }
    } catch (apiErr: any) {
      const errorMsg = apiErr.response?.data?.error;
      if (errorMsg) {
        return { success: false, error: errorMsg };
      }
    }

    // Local fallback
    const users = this.getUsers();
    if (users.some(u => u.username.toLowerCase() === trimmedUser)) {
      return { success: false, error: `Username "${data.username}" is already taken.` };
    }

    if (data.role === 'admin') {
      const existingAdmin = users.find(u => u.role === 'admin');
      if (existingAdmin) {
        return { 
          success: false, 
          error: `Only one Administrator account is permitted. Currently, "${existingAdmin.fullName}" is the sole Administrator.` 
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
  async updateUser(userId: string, updates: Partial<User>, newPassword?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.put(`/api/users/${userId}`, { ...updates, password: newPassword });
    } catch {
      // fallback to local
    }

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      return { success: false, error: 'User not found.' };
    }

    const currentUser = users[index];

    if (currentUser.username === 'sysadmin' && updates.username && updates.username !== 'sysadmin') {
      return { success: false, error: 'The primary sysadmin username cannot be altered.' };
    }

    if (updates.role === 'admin' && currentUser.role !== 'admin') {
      const existingAdmin = users.find(u => u.id !== userId && u.role === 'admin');
      if (existingAdmin) {
        return { 
          success: false, 
          error: `Only one Administrator account is permitted. "${existingAdmin.fullName}" is currently the sole Administrator.` 
        };
      }
    }

    if (currentUser.role === 'admin') {
      if (updates.role && updates.role !== 'admin') {
        return { 
          success: false, 
          error: 'The system must always have exactly one Administrator account.' 
        };
      }
      if (updates.isActive === false) {
        return { 
          success: false, 
          error: 'The primary Administrator account cannot be deactivated.' 
        };
      }
    }

    users[index] = { 
      ...users[index], 
      ...updates, 
      ...(newPassword ? { password: newPassword } : {}) 
    };
    this.saveUsers(users);

    return { success: true };
  },

  /**
   * Delete a user (cannot delete the admin)
   */
  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.delete(`/api/users/${userId}`);
    } catch {
      // ignore
    }

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
