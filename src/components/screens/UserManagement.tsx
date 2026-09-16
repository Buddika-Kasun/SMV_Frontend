import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Key,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  X,
  Phone,
  Mail,
} from "lucide-react";
import {
  userService,
  UserFilterParams,
  PaginatedUsersResponse,
} from "../../services/user.service";
import { Pagination } from "../common/Pagination";
import { ConfirmModal } from "../common/ConfirmModal";
import toast from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";
import { User, UserRole } from "../../api";
import { toDateInput, toDateTimeDisplay } from "../../utils/loanUtils";

interface UserManagementProps {
  currentUser: User;
}

const PAGE_SIZE = 10;

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    {/* User & Designation */}
    <td className="p-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-200" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-2.5 w-20 bg-slate-200 rounded" />
          <div className="h-2.5 w-16 bg-slate-200 rounded" />
        </div>
      </div>
    </td>

    {/* Role */}
    <td className="p-3.5">
      <div className="h-5 w-24 bg-slate-200 rounded-full" />
    </td>

    {/* Contact */}
    <td className="p-3.5 space-y-1.5">
      <div className="h-2.5 w-32 bg-slate-200 rounded" />
      <div className="h-2.5 w-24 bg-slate-200 rounded" />
    </td>

    {/* Status */}
    <td className="p-3.5">
      <div className="h-5 w-16 bg-slate-200 rounded-full" />
    </td>

    {/* Last Active / Created */}
    <td className="p-3.5 space-y-1.5">
      <div className="h-2.5 w-24 bg-slate-200 rounded" />
      <div className="h-2.5 w-28 bg-slate-200 rounded" />
    </td>

    {/* Actions */}
    <td className="p-3.5">
      <div className="flex items-center justify-end gap-1">
        <div className="w-6 h-6 bg-slate-200 rounded-lg" />
        <div className="w-6 h-6 bg-slate-200 rounded-lg" />
        <div className="w-6 h-6 bg-slate-200 rounded-lg" />
        <div className="w-6 h-6 bg-slate-200 rounded-lg" />
      </div>
    </td>
  </tr>
);

/**
 * System User Management & Security Access Control
 * Includes API-based pagination and filtering
 */
export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Confirmation Modals State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(
    null,
  );
  const [isResetDefaultsConfirmOpen, setIsResetDefaultsConfirmOpen] =
    useState(false);
  const [isPasswordChangeConfirmOpen, setIsPasswordChangeConfirmOpen] =
    useState(false);

  // New User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("staff");
  const [newDesignation, setNewDesignation] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Form State
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("staff");
  const [editDesignation, setEditDesignation] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  // Password Reset State
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UserFilterParams = {
        page: currentPage,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
      };

      // Use debouncedSearch instead of search
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (roleFilter !== "all") {
        params.role = roleFilter;
      }

      const response: PaginatedUsersResponse =
        await userService.getUsers(params);
      setUsers(response.items);
      setTotalItems(response.meta.totalItems);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, roleFilter, sortBy, sortOrder]);

  // Load users on filter change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch admin user once on mount
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const admin = await userService.getAdminUser();
        setAdminUser(admin || null);
      } catch (error) {
        console.error("Failed to fetch admin user:", error);
      } finally {
        setLoadingAdmin(false);
      }
    };
    fetchAdmin();
  }, []);

  const hasAdmin = !!adminUser;
  const existingAdmin = adminUser;

  const handleRoleFilterChange = (role: "all" | UserRole) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setNewUsername("");
    setNewPassword("");
    setNewFullName("");
    setNewRole("staff");
    setNewDesignation("");
    setNewEmail("");
    setNewPhone("");
    setShowPassword(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword || !newFullName.trim()) {
      toast.error("Username, password, and full name are required.");
      return;
    }

    const res = await userService.createUser({
      username: newUsername,
      password: newPassword,
      fullName: newFullName,
      role: newRole,
      designation: newDesignation,
      email: newEmail,
      phone: newPhone,
    });

    if (res.success && res.user) {
      toast.success(`User "${res.user.fullName}" created successfully!`);
      setIsCreateModalOpen(false);
      fetchUsers();
    } else {
      toast.error(res.error || "Failed to create user.");
    }
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setEditFullName(u.fullName);
    setEditRole(u.role);
    setEditDesignation(u.designation);
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
    setEditIsActive(u.isActive);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const res = await userService.updateUser(selectedUser.id, {
      fullName: editFullName.trim(),
      role: editRole,
      designation: editDesignation.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      isActive: editIsActive,
    });

    if (res.success) {
      toast.success(`User details for "${selectedUser.fullName}" updated!`);
      setIsEditModalOpen(false);
      fetchUsers();
    } else {
      toast.error(res.error || "Failed to update user.");
    }
  };

  const handleOpenPasswordReset = (u: User) => {
    setSelectedUser(u);
    setResetPasswordValue("");
    setIsPasswordModalOpen(true);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!resetPasswordValue) {
      toast.error("Please provide a new password.");
      return;
    }
    setIsPasswordChangeConfirmOpen(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!selectedUser || !resetPasswordValue) return;

    const res = await userService.updateUser(selectedUser.id, {
      password: resetPasswordValue,
    });

    setIsPasswordChangeConfirmOpen(false);

    if (res.success) {
      toast.success(`Password updated for user "${selectedUser.fullName}"!`);
      setIsPasswordModalOpen(false);
      fetchUsers();
    } else {
      toast.error(res.error || "Failed to reset password.");
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    if (userToToggleStatus.username === "sysadmin") {
      toast.error("The primary sysadmin account cannot be deactivated.");
      setUserToToggleStatus(null);
      return;
    }

    const newStatus = !userToToggleStatus.isActive;
    const res = await userService.updateUser(userToToggleStatus.id, {
      isActive: newStatus,
    });
    setUserToToggleStatus(null);
    if (res.success) {
      toast.success(
        `User "${userToToggleStatus.fullName}" ${newStatus ? "activated" : "deactivated"}.`,
      );
      fetchUsers();
    } else {
      toast.error(res.error || "Status update failed.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.username === "sysadmin") {
      toast.error("The primary sysadmin account cannot be deleted.");
      setUserToDelete(null);
      return;
    }

    const res = await userService.deleteUser(userToDelete.id);
    setUserToDelete(null);
    if (res.success) {
      toast.success(`User account deleted.`);
      fetchUsers();
    } else {
      toast.error(res.error || "Failed to delete user.");
    }
  };

  const handleConfirmResetDefaults = async () => {
    await userService.resetToDefaults();
    setIsResetDefaultsConfirmOpen(false);
    fetchUsers();
    toast.success(
      "User database reset to defaults. Canonical sysadmin, manager, and staff accounts restored.",
    );
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            System User Management & Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system accounts, assign security roles (Admin, Manager,
            Staff), and manage system access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* <button
            onClick={() => setIsResetDefaultsConfirmOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition border border-slate-200 cursor-pointer"
            title="Reset user accounts back to standard defaults and purge test accounts"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button> */}

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Administrator Role</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300">
              Limit: 1 of 1 Max
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Strictly limited to <strong>one master account</strong> in the
            entire system. Holds system-level root authority, IT provisioning,
            and user administration.
          </p>
          {existingAdmin && (
            <div className="mt-2 text-[10px] font-mono text-blue-700 bg-blue-50/80 px-2 py-1 rounded-md border border-blue-100 flex items-center justify-between">
              <span>Assigned: @{existingAdmin.username}</span>
              <span className="font-sans font-bold text-emerald-700">
                Active
              </span>
            </div>
          )}
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Manager Role (Multiple)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Manager
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Same operational & managerial rights as Admin: Full access to micro
            finance dashboard, user management, loan approvals/rejections, and
            financial reporting.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Staff Role (Multiple)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
              Staff
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Operational frontline rights: Creating new payments, loan
            applications, early settlements, KYC, and customers. (Dashboard and
            User Management restricted).
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by username, full name, email..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          {(["all", "admin", "manager", "staff"] as const).map((role) => (
            <button
              key={role}
              onClick={() => handleRoleFilterChange(role)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                roleFilter === role
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {role === "all" ? "All Roles" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table with Pagination — content-fit */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col flex-1">
        {/* Table header label */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            User Accounts
          </h3>
          <span className="text-[10px] text-slate-400">
            {totalItems} account{totalItems !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table wrapper — horizontal scroll when narrow */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
              <tr className="border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort("fullName")}
                >
                  User & Designation{" "}
                  {sortBy === "fullName" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 text-center"
                  onClick={() => handleSort("role")}
                >
                  Role {sortBy === "role" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3">Contact Details</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 text-center"
                  onClick={() => handleSort("isActive")}
                >
                  Status{" "}
                  {sortBy === "isActive" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort("lastLogin")}
                >
                  Last Active / Created{" "}
                  {sortBy === "lastLogin" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={`skeleton-${i}`} />
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500 text-xs"
                  >
                    No user accounts match the current search or filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrent = currentUser.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      {/* User & Designation */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : user.role === "manager"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {user.fullName.substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">
                                {user.fullName}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px] block">
                              {user.designation}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          {user.role === "admin" ? (
                            <div className="flex flex-col gap-1 items-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                                <span>Administrator</span>
                              </span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-700 text-white tracking-normal">
                                Sole Admin
                              </span>
                            </div>
                          ) : user.role === "manager" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <ShieldCheck className="w-3 h-3" />
                              manager
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200/60">
                              <ShieldCheck className="w-3 h-3" />
                              staff
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3 text-slate-600">
                        <div className="space-y-0.5">
                          {user.email ? (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{user.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              No email
                            </span>
                          )}
                          {user.phone ? (
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-rose-50 text-rose-700 border border-rose-200/60"
                            }`}
                          >
                            {user.isActive ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {user.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </td>

                      {/* Last Login / Created */}
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        <span className="block font-medium text-slate-700">
                          {toDateTimeDisplay(user.lastLogin) || "Never logged in"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Created: {toDateInput(user.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit User Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenPasswordReset(user)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {user.role !== "admin" &&
                          user.username !== "sysadmin" ? (
                            <button
                              onClick={() => setUserToToggleStatus(user)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                user.isActive
                                  ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={
                                user.isActive
                                  ? "Deactivate User"
                                  : "Activate User"
                              }
                            >
                              {user.isActive ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <div
                              className="p-1.5 text-slate-300"
                              title="Primary Administrator account cannot be deactivated"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          )}

                          {user.role !== "admin" &&
                            user.username !== "sysadmin" && (
                              <button
                                onClick={() => setUserToDelete(user)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* User Management Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemName="user accounts"
        />
      </div>

      {/* ========================================================= */}
      {/* CREATE NEW USER MODAL                                      */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Create New System Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Provide staff profile details and assign operational role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="p-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. jperera"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Initial Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Janaka Perera"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">
                    Security Role *
                  </label>
                  {hasAdmin && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      1 Admin limit reached
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "manager", "staff"] as const).map((role) => {
                    const isAdminDisabled = role === "admin" && hasAdmin;

                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => !isAdminDisabled && setNewRole(role)}
                        disabled={isAdminDisabled}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isAdminDisabled
                            ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                            : newRole === role
                              ? "border-blue-600 bg-blue-50/50 text-blue-950 font-bold shadow-2xs cursor-pointer"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize text-xs block">
                            {role === "admin" ? "Admin" : role}
                          </span>
                          {newRole === role && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          {isAdminDisabled && (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 block font-normal mt-0.5">
                          {role === "admin"
                            ? isAdminDisabled
                              ? "Max 1 limit reached"
                              : "Master Authority"
                            : role === "manager"
                              ? "Full Access + Approvals"
                              : "Payments & KYC Only"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Job Designation / Title
                </label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. Senior Credit Officer"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@smvholdings.lk"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Official Phone
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="077XXXXXXX"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT USER MODAL                                            */}
      {/* ========================================================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit User: {selectedUser.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    @{selectedUser.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">
                    Security Role
                  </label>
                  {selectedUser.role === "admin" ? (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      Sole Administrator (Locked)
                    </span>
                  ) : hasAdmin ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      1 Admin limit reached
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "manager", "staff"] as const).map((role) => {
                    const isRoleDisabled =
                      (selectedUser.role === "admin" && role !== "admin") ||
                      (selectedUser.role !== "admin" &&
                        role === "admin" &&
                        hasAdmin);

                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => !isRoleDisabled && setEditRole(role)}
                        disabled={isRoleDisabled}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isRoleDisabled
                            ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                            : editRole === role
                              ? "border-blue-600 bg-blue-50/50 text-blue-950 font-bold shadow-2xs cursor-pointer"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize text-xs block">
                            {role === "admin" ? "Admin" : role}
                          </span>
                          {editRole === role && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          {isRoleDisabled && (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 block font-normal mt-0.5">
                          {role === "admin"
                            ? selectedUser.role === "admin"
                              ? "Primary Admin"
                              : "Max 1 limit"
                            : role === "manager"
                              ? "Full Access"
                              : "Payments & KYC"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Job Designation
                </label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              {selectedUser.username !== "sysadmin" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Account Status
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Allow user to authenticate and access portal
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      editIsActive
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {editIsActive ? "Active" : "Disabled"}
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RESET PASSWORD MODAL                                      */}
      {/* ========================================================= */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Reset Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    For user: {selectedUser.fullName} (@{selectedUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handlePasswordResetSubmit}
              className="p-5 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  New Password *
                </label>
                <input
                  type="text"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer"
                >
                  Proceed to Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete User */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        description="Are you sure you want to permanently remove this user account? The user will immediately lose access to the system."
        confirmLabel="Permanently Delete"
        cancelLabel="Keep User"
        variant="danger"
        details={
          userToDelete
            ? [
                { label: "Username", value: `@${userToDelete.username}` },
                { label: "Full Name", value: userToDelete.fullName },
                {
                  label: "Assigned Role",
                  value: userToDelete.role.toUpperCase(),
                },
                {
                  label: "Designation",
                  value: userToDelete.designation || "Staff",
                },
              ]
            : []
        }
      />

      {/* Confirmation Modal: Toggle User Status */}
      <ConfirmModal
        isOpen={Boolean(userToToggleStatus)}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={handleConfirmToggleStatus}
        title={
          userToToggleStatus?.isActive
            ? "Deactivate User Account"
            : "Activate User Account"
        }
        description={
          userToToggleStatus?.isActive
            ? "Are you sure you want to disable this user account? The user will be blocked from logging into the portal."
            : "Are you sure you want to reactivate this user account? The user will regain portal access."
        }
        confirmLabel={
          userToToggleStatus?.isActive
            ? "Deactivate Account"
            : "Activate Account"
        }
        cancelLabel="Cancel"
        variant={userToToggleStatus?.isActive ? "warning" : "success"}
        details={
          userToToggleStatus
            ? [
                { label: "Username", value: `@${userToToggleStatus.username}` },
                { label: "Full Name", value: userToToggleStatus.fullName },
                {
                  label: "Current Status",
                  value: userToToggleStatus.isActive ? "Active" : "Disabled",
                },
                {
                  label: "New Status",
                  value: userToToggleStatus.isActive ? "Disabled" : "Active",
                },
              ]
            : []
        }
      />

      {/* Confirmation Modal: Password Change Confirmation */}
      <ConfirmModal
        isOpen={isPasswordChangeConfirmOpen}
        onClose={() => setIsPasswordChangeConfirmOpen(false)}
        onConfirm={handleConfirmPasswordReset}
        title="Confirm Password Update"
        description="Are you sure you want to override and update the password for this account? The user must use the new credentials for all future sign-ins."
        confirmLabel="Confirm Password Change"
        cancelLabel="Cancel"
        variant="warning"
        details={
          selectedUser
            ? [
                {
                  label: "Target Account",
                  value: `@${selectedUser.username} (${selectedUser.fullName})`,
                },
                { label: "New Password", value: resetPasswordValue },
              ]
            : []
        }
      />

      {/* Confirmation Modal: Reset Defaults */}
      <ConfirmModal
        isOpen={isResetDefaultsConfirmOpen}
        onClose={() => setIsResetDefaultsConfirmOpen(false)}
        onConfirm={handleConfirmResetDefaults}
        title="Reset User Database to Factory Defaults"
        description="Are you sure you want to restore the standard system accounts (sysadmin, manager1, staff1)? Any newly created accounts or password changes will be reset."
        confirmLabel="Reset All Users to Defaults"
        cancelLabel="Keep Current Users"
        variant="danger"
        details={[
          { label: "Accounts Restored", value: "sysadmin, manager1, staff1" },
          {
            label: "Default Passwords",
            value: "admin123, manager123, staff123",
          },
        ]}
      />
    </div>
  );
};
