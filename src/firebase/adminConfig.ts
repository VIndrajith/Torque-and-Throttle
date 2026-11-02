import { AdminUser } from '../types';

export const SYSTEM_ADMINS: AdminUser[] = [
  {
    id: 'superadmin-indrajith',
    role: 'superadmin',
    name: 'Indrajith (Master Admin)',
    email: 'indrajith08102003@gmail.com',
    location: 'Central Operations HQ',
    phone: '+91 98765 43210',
  },
  {
    id: 'admin-sanjay',
    role: 'admin',
    name: 'Sanjay Sudhakaran',
    email: 'sudhakaransanjay921@gmail.com',
    location: 'Kerala District Desk',
    phone: '+91 94005 81250',
  },
];

/**
 * Resolves the system administrator for a given email.
 */
export function resolveAdminForEmail(email?: string): AdminUser | undefined {
  if (!email) return undefined;
  return SYSTEM_ADMINS.find((a) => a.email.toLowerCase() === email.toLowerCase());
}

export function resolveAdminForLocation(_location?: string): AdminUser {
  return SYSTEM_ADMINS[0];
}

export function getAdminById(adminId?: string): AdminUser | undefined {
  if (!adminId) return SYSTEM_ADMINS[0];
  return SYSTEM_ADMINS.find((a) => a.id === adminId) || SYSTEM_ADMINS[0];
}

