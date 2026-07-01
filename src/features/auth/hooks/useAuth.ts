import { useAuthStore } from '../../../store/useAuthStore';

export function useAuth() {
  const { user, memberId, role, roles, firstName, lastName } = useAuthStore();
  return {
    user,
    member: memberId ? { id: memberId } : null,
    role,
    roles,
    firstName,
    lastName
  };
}
