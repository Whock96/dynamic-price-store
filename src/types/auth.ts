
import { User as BaseUser, Permission } from '../types/types';

export interface AuthContextType {
  user: BaseUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  fetchPermissions: () => Promise<void>;
  fetchUserTypes: () => Promise<any[]>;
  checkAccess: (menuPath: string) => boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  requiredRoles: string[];
  submenus?: MenuItem[];
}
