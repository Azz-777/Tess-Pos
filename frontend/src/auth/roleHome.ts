import { Role } from '../types';

export function roleHome(role: Role): string {
  if (role === 'superadmin') return '/businesses';
  if (role === 'admin') return '/reports';
  return '/pos';
}
