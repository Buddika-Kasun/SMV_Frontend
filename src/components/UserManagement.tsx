import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  X,
  Phone,
  Mail,
  Briefcase,
  User as UserIcon,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { User, UserRole } from '../types';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [newDesignation, setNewDesignation] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('staff');
  const [editDesignation, setEditDesignation] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Password Reset State
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const refreshUsers = () => {
    setUsers(userService.getUsers());
  };

  const existingAdmin = users.find(u => u.role === 'admin');
  const hasAdmin = !!existingAdmin;

  useEffect(() => {
    refreshUsers();
  }, []);

  const handleOpenCreate = () => {
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewRole('staff');
    setNewDesignation('');
    setNewEmail('');
    setNewPhone('');
    setShowPassword(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword || !newFullName.trim()) {
      toast.error('Username, password, and full name are required.');
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
      toast.success(`User "${res.user.username}" created successfully!`);
      setIsCreateModalOpen(false);
      refreshUsers();
    } else {
      toast.error(res.error || 'Failed to create user.');
    }
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setEditFullName(u.fullName);
    setEditRole(u.role);
    setEditDesignation(u.designation);
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
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
      toast.success(`User details for "${selectedUser.username}" updated!`);
      setIsEditModalOpen(false);
      refreshUsers();
    } else {
      toast.error(res.error || 'Failed to update user.');
    }
  };

  const handleOpenPasswordReset = (u: User) => {
    setSelectedUser(u);
    setResetPasswordValue('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!resetPasswordValue) {
      toast.error('Please provide a new password.');
      return;
    }

    const res = await userService.updateUser(selectedUser.id, {
      password: resetPasswordValue,
    });

    if (res.success) {
      toast.success(`Password updated for user "${selectedUser.username}"!`);
      setIsPasswordModalOpen(false);
      refreshUsers();
    } else {
      toast.error(res.error || 'Failed to reset password.');
    }
  };

  const handleToggleStatus = async (u: User) => {
    if (u.username === 'sysadmin') {
      toast.error('The primary sysadmin account cannot be deactivated.');
      return;
    }

    const newStatus = !u.isActive;
    const res = await userService.updateUser(u.id, { isActive: newStatus });
    if (res.success) {
      toast.success(`User "${u.username}" ${newStatus ? 'activated' : 'deactivated'}.`);
      refreshUsers();
    } else {
      toast.error(res.error || 'Status update failed.');
    }
  };

  const handleDelete = async (u: User) => {
    if (u.username === 'sysadmin') {
      toast.error('The primary sysadmin account cannot be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user account "${u.username}" (${u.fullName})? This action is permanent.`)) {
      const res = await userService.deleteUser(u.id);
      if (res.success) {
        toast.success(`User account "${u.username}" deleted.`);
        refreshUsers();
      } else {
        toast.error(res.error || 'Failed to delete user.');
      }
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm('Reset user accounts back to canonical defaults (sysadmin, manager1, staff1)? Any test accounts will be removed.')) {
      await userService.resetToDefaults();
      refreshUsers();
      toast.success('User database reset to defaults. Only original sysadmin, manager1, and staff1 retained.');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchesSearch = 
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.designation.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-4">
      
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
            Configure system accounts, assign security roles (Admin, Manager, Staff), and manage system access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition border border-slate-200 cursor-pointer"
            title="Reset user accounts back to standard defaults and purge test accounts"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

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
              <span>👑 Administrator</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300">
              Limit: 1 of 1 Max
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Strictly limited to <strong>one master account</strong> in the entire system. Holds system-level root authority, IT provisioning, and user administration.
          </p>
          {existingAdmin && (
            <div className="mt-2 text-[10px] font-mono text-blue-700 bg-blue-50/80 px-2 py-1 rounded-md border border-blue-100 flex items-center justify-between">
              <span>Assigned: @{existingAdmin.username}</span>
              <span className="font-sans font-bold text-emerald-700">Active</span>
            </div>
          )}
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Manager Role (Multiple)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              manager
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Same operational & managerial rights as Admin: Full access to micro finance dashboard, user management, loan approvals/rejections, and financial reporting.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Staff Role (Multiple)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
              staff
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Operational frontline rights: Creating new payments, loan applications, early settlements, KYC, and customers. (Dashboard and User Management restricted).
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username, full name, email..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          {(['all', 'admin', 'manager', 'staff'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                roleFilter === role
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'all' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-3.5">User & Designation</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Active / Created</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                    No user accounts match the current search or filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrent = currentUser.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* User & Designation */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'manager' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {user.fullName.substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.fullName}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px] block">{user.designation}</span>
                            <span className="text-slate-400 font-mono text-[10px]">@{user.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                            <span>Administrator</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-700 text-white tracking-normal">
                              Sole Admin
                            </span>
                          </span>
                        ) : user.role === 'manager' ? (
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
                      </td>

                      {/* Contact Details */}
                      <td className="p-3.5 text-slate-600 space-y-0.5">
                        {user.email ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No email</span>
                        )}
                        {user.phone ? (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {user.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Last Login / Created */}
                      <td className="p-3.5 text-[11px] text-slate-500">
                        <span className="block font-medium text-slate-700">
                          {user.lastLogin || 'Never logged in'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Created: {user.createdAt}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit User Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenPasswordReset(user)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Deactivate (Admin cannot be deactivated) */}
                          {user.role !== 'admin' && user.username !== 'sysadmin' ? (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                user.isActive 
                                  ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50' 
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.isActive ? <XCircle className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <div className="p-1.5 text-slate-300" title="Primary Administrator account cannot be deactivated">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          )}

                          {/* Delete Account (Admin cannot be deleted) */}
                          {user.role !== 'admin' && user.username !== 'sysadmin' && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
                  <h3 className="font-bold text-slate-900 text-sm">Create New System Account</h3>
                  <p className="text-[11px] text-slate-500">Provide staff profile details and assign operational role</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="e.g. jperera"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Initial Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="e.g. Janaka Perera"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">Security Role *</label>
                  {hasAdmin && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      1 Admin limit reached
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'manager', 'staff'] as const).map(role => {
                    const isAdminDisabled = role === 'admin' && hasAdmin;

                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => !isAdminDisabled && setNewRole(role)}
                        disabled={isAdminDisabled}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isAdminDisabled
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                            : newRole === role
                            ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold shadow-2xs cursor-pointer'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize text-xs block">
                            {role === 'admin' ? 'Admin' : role}
                          </span>
                          {newRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                          {isAdminDisabled && <Lock className="w-3 h-3 text-slate-400" />}
                        </div>
                        <span className="text-[9px] text-slate-500 block font-normal mt-0.5">
                          {role === 'admin'
                            ? (isAdminDisabled ? 'Max 1 limit reached' : 'Master Authority')
                            : role === 'manager'
                            ? 'Full Access + Approvals'
                            : 'Payments & KYC Only'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Job Designation / Title</label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  placeholder="e.g. Senior Credit Officer"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Official Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@smvholdings.lk"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Official Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-2xs"
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
                  <h3 className="font-bold text-slate-900 text-sm">Edit User: {selectedUser.fullName}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">@{selectedUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">Security Role</label>
                  {selectedUser.role === 'admin' ? (
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
                  {(['admin', 'manager', 'staff'] as const).map(role => {
                    // If user is currently the admin, lock role to admin
                    // If user is not admin and an admin already exists, disable admin option
                    const isRoleDisabled = 
                      (selectedUser.role === 'admin' && role !== 'admin') ||
                      (selectedUser.role !== 'admin' && role === 'admin' && hasAdmin);

                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => !isRoleDisabled && setEditRole(role)}
                        disabled={isRoleDisabled}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isRoleDisabled
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                            : editRole === role
                            ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold shadow-2xs cursor-pointer'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize text-xs block">
                            {role === 'admin' ? 'Admin' : role}
                          </span>
                          {editRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                          {isRoleDisabled && <Lock className="w-3 h-3 text-slate-400" />}
                        </div>
                        <span className="text-[9px] text-slate-500 block font-normal mt-0.5">
                          {role === 'admin' 
                            ? (selectedUser.role === 'admin' ? 'Primary Admin' : 'Max 1 limit')
                            : role === 'manager'
                            ? 'Full Access'
                            : 'Payments & KYC'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Job Designation</label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={e => setEditDesignation(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              {selectedUser.username !== 'sysadmin' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Account Status</span>
                    <span className="text-[11px] text-slate-500">Allow user to authenticate and access portal</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      editIsActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {editIsActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-2xs"
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
                  <h3 className="font-bold text-slate-900 text-sm">Reset Password</h3>
                  <p className="text-[11px] text-slate-500">For user: {selectedUser.fullName} (@{selectedUser.username})</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">New Password *</label>
                <input
                  type="text"
                  required
                  value={resetPasswordValue}
                  onChange={e => setResetPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition shadow-2xs"
                >
                  Update Password
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
