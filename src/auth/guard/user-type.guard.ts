import {
  AuthenticatedUser,
  AuthenticatedInstructor,
  AuthenticatedStudent,
} from '../dto';

export function isInstructor(
  user: AuthenticatedUser,
): user is AuthenticatedInstructor {
  return 'siret' in user;
}

export function isStudent(
  user: AuthenticatedUser,
): user is AuthenticatedStudent {
  return 'neph' in user;
}

export function getUserInfo(user: AuthenticatedUser): {
  id: number;
  type: 'instructor' | 'student';
} {
  return {
    id: user.id,
    type: isInstructor(user) ? 'instructor' : 'student',
  };
}
