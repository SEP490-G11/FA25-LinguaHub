/**
 * User interface matching API response structure
 * Based on requirements 1.2 - display comprehensive user information
 */
export interface User {
  userID: number;
  username: string;
  email: string;
  fullName: string;
  avatarURL: string;
  gender: string;
  dob: string; // ISO date string
  phone: string;
  country: string;
  address: string;
  bio: string;
  isActive: boolean;
  role: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * API response wrapper for user list endpoint
 * Follows existing API response pattern from TutorApproval
 */
export interface UsersResponse {
  code: number;
  message: string;
  result: User[];
}

/**
 * API response wrapper for delete user endpoint
 */
export interface DeleteUserResponse {
  code: number;
  message: string;
  result?: any;
}

/**
 * Component state interface for user table management
 */
export interface UserTableState {
  users: User[];
  loading: boolean;
  error: string | null;
}

/**
 * Component state interface for delete confirmation modal
 */
export interface DeleteModalState {
  isOpen: boolean;
  selectedUser: User | null;
  isDeleting: boolean;
}

/**
 * Hook state interface for user data management
 */
export interface UseUsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook state interface for delete user operations
 */
export interface UseDeleteUserState {
  isDeleting: boolean;
  deleteUser: (userID: number) => Promise<void>;
  error: string | null;
}