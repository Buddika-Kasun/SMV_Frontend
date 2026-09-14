import { User, UserRole } from "../api";
import { authEndpoint } from "../api/endpoints/auth.endpoint";
import { userEndpoint } from "../api/endpoints/user.endpoint";
import { TokenService } from "../api/services/token.service";

// Session storage keys
const SESSION_STORAGE_KEY = "smv_holdings_current_session_v3";

export interface UserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedUsersResponse {
  items: User[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class UserService {
  private static instance: UserService;

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Fetch users with pagination and filters from API
   */
  async getUsers(
    params: UserFilterParams = {},
  ): Promise<PaginatedUsersResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      const response = await userEndpoint.getAll({
        page,
        limit,
        search,
        role,
        sortBy,
        sortOrder,
      });

      if (response.success && response.data) {
        return {
          items: response.data.items,
          meta: response.data.meta,
        };
      }
      throw new Error(response.message || "Failed to fetch users");
    } catch (error) {
      console.error("Failed to fetch users from API:", error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await userEndpoint.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "User not found");
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get currently logged-in user session
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Set current logged-in user
   */
  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  /**
   * Authenticate user with backend API
   */
  async login(
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    const trimmedUser = (username || "").trim();
    const trimmedPass = (password || "").trim();

    if (!trimmedUser) {
      return { success: false, error: "Please enter your username." };
    }
    if (!trimmedPass) {
      return { success: false, error: "Please enter your password." };
    }

    try {
      // Call the real API login
      const response = await authEndpoint.login({
        username: trimmedUser,
        password: trimmedPass,
      });

      if (response.success && response.data) {
        // Store tokens and user data
        TokenService.setTokens(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.expiresIn,
        );

        const user = response.data.user;
        this.setCurrentUser(user);

        return { success: true, user };
      } else {
        return {
          success: false,
          error:
            response.message ||
            "Authentication failed. Please check your credentials.",
        };
      }
    } catch (error: any) {
      console.error("Login API error:", error);

      // Extract error message from response
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    authEndpoint.logout();
    this.setCurrentUser(null);
    TokenService.clearTokens();
  }

  /**
   * Create a new user via API
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
    const trimmedUser = data.username.trim();
    const trimmedPass = data.password.trim();

    if (!trimmedUser || !trimmedPass || !data.fullName.trim()) {
      return {
        success: false,
        error: "Username, password, and full name are required.",
      };
    }

    try {
      const response = await userEndpoint.create({
        username: trimmedUser,
        password: trimmedPass,
        fullName: data.fullName.trim(),
        role: data.role,
        designation: data.designation.trim(),
        email: data.email?.trim(),
        phone: data.phone?.trim(),
      });

      if (response.success && response.data) {
        return { success: true, user: response.data };
      } else {
        return {
          success: false,
          error: response.message || "Failed to create user.",
        };
      }
    } catch (error: any) {
      console.error("Create user API error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create user.";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update an existing user via API
   */
  async updateUser(
    userId: string,
    updates: Partial<User>,
    newPassword?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = {
        fullName: updates.fullName,
        designation: updates.designation,
        email: updates.email,
        phone: updates.phone,
        role: updates.role,
        isActive: updates.isActive,
      };

      if (newPassword) {
        payload.password = newPassword.trim();
      }

      const response = await userEndpoint.update(userId, payload);

      if (response.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.message || "Failed to update user.",
        };
      }
    } catch (error: any) {
      console.error("Update user API error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update user.";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete a user via API
   */
  async deleteUser(
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await userEndpoint.delete(userId);

      if (response.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.message || "Failed to delete user.",
        };
      }
    } catch (error: any) {
      console.error("Delete user API error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete user.";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Reset users to default baseline (admin only)
   */
  async resetToDefaults(): Promise<User[]> {
    try {
      const response = await userEndpoint.resetDefaults();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to reset users");
    } catch (error) {
      console.error("Reset users API error:", error);
      throw error;
    }
  }

  /**
   * Refresh current user data
   */
  async refreshCurrentUser(): Promise<User | null> {
    try {
      const response = await authEndpoint.getMe();
      if (response.success && response.data) {
        this.setCurrentUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return null;
    }
  }

  /**
   * Get the single active Administrator user
   */
  async getAdminUser(): Promise<User | undefined> {
    try {
      const users = await this.getUsers({ limit: 1, role: "admin" });
      return users.items.find((u) => u.role === "admin");
    } catch (error) {
      console.error("Failed to get admin user:", error);
      throw error;
    }
  }

  /**
   * Check if an Administrator account exists
   */
  async hasAdmin(): Promise<boolean> {
    try {
      const users = await this.getUsers({ limit: 100 });
      return users.items.some((u) => u.role === "admin");
    } catch (error) {
      console.error("Failed to check admin existence:", error);
      throw error;
    }
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return TokenService.getAccessToken();
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    return TokenService.isTokenExpired();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = this.getToken();
    const user = this.getCurrentUser();
    const isTokenValid = accessToken ? !TokenService.isTokenExpired() : false;

    return !!(accessToken && user && isTokenValid);
  }

  // Permission helpers - these don't need API calls
  canAccessDashboard(role: UserRole): boolean {
    return role === "admin" || role === "manager";
  }

  canApproveLoans(role: UserRole): boolean {
    return role === "admin" || role === "manager";
  }

  canManageUsers(role: UserRole): boolean {
    return role === "admin" || role === "manager";
  }

  canViewReports(role: UserRole): boolean {
    return role === "admin" || role === "manager";
  }
}

// Export singleton instance
export const userService = UserService.getInstance();
