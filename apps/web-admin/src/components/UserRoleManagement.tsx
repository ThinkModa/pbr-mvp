import React, { useState, useEffect } from 'react';
import { roleManagement, UserWithRole, RoleHistoryEntry } from '../utils/roleManagement';

interface UserRoleManagementProps {
  onRoleChange?: (userId: string, newRole: string) => void;
}

export const UserRoleManagement: React.FC<UserRoleManagementProps> = ({ onRoleChange }) => {
  console.log('UserRoleManagement: Component rendered');
  // For now, use a mock admin user since the web admin doesn't have proper auth context yet
  const currentUser = { id: '11111111-1111-1111-1111-111111111111', email: 'rahwalton9@gmail.com' };
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [roleHistory, setRoleHistory] = useState<RoleHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    console.log('UserRoleManagement: Loading users...');
    setLoading(true);
    setError(null);
    
    const result = await roleManagement.getAllUsersWithRoles();
    console.log('UserRoleManagement: Load users result:', result);
    
    if (result.success) {
      setUsers(result.users);
      console.log('UserRoleManagement: Users loaded:', result.users);
    } else {
      setError(result.error || 'Failed to load users');
      console.error('UserRoleManagement: Error loading users:', result.error);
    }
    
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'business' | 'general') => {
    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    setChangingRole(userId);
    setError(null);

    const result = await roleManagement.changeUserRole(
      userId,
      newRole,
      currentUser.id,
      `Role changed by ${currentUser.email}`
    );

    if (result.success) {
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      // Notify parent component
      onRoleChange?.(userId, newRole);
      
      // Reload users to ensure consistency
      await loadUsers();
    } else {
      setError(result.error || 'Failed to change role');
    }

    setChangingRole(null);
  };

  const loadRoleHistory = async (user: UserWithRole) => {
    setSelectedUser(user);
    setShowHistory(true);
    
    const result = await roleManagement.getUserRoleHistory(user.id);
    
    if (result.success) {
      setRoleHistory(result.history);
    } else {
      setError(result.error || 'Failed to load role history');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'business': return 'bg-blue-100 text-blue-800';
      case 'general': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Role Management</h2>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Users</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage user roles and permissions
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Current Role Badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  
                  {/* Role Change Dropdown */}
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'business' | 'general')}
                    disabled={changingRole === user.id || user.id === currentUser?.id}
                    className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="general">General</option>
                    <option value="business">Business</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  {/* History Button */}
                  <button
                    onClick={() => loadRoleHistory(user)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    History
                  </button>
                  
                  {/* Loading Indicator */}
                  {changingRole === user.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Role History Modal */}
      {showHistory && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Role History - {selectedUser.name}
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {roleHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No role changes recorded</p>
                ) : (
                  roleHistory.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.old_role)}`}>
                              {entry.old_role}
                            </span>
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.new_role)}`}>
                              {entry.new_role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Changed by: {entry.changed_by_name}
                          </p>
                          {entry.reason && (
                            <p className="text-sm text-gray-500 mt-1">
                              Reason: {entry.reason}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
