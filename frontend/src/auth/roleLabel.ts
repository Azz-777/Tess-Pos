import { Role } from '../types';

export function roleLabel(role: Role): string {
  if (role === 'superadmin') return 'Super admin';
  if (role === 'admin') return 'Admin';
  return 'Kassir';
}
