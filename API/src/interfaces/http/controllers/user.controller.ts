import { RequestHandler } from 'express';
import type { createUserUseCases } from '../../../application/users/user.usecases';
import {
  asyncHandler,
  parseOptionalBoolean,
  parseOptionalUserRole,
  parseRequiredString,
} from '../request.utils';

type UserUseCases = ReturnType<typeof createUserUseCases>;

interface UserController {
  createUser: RequestHandler;
  listTechnicians: RequestHandler;
  getUserById: RequestHandler;
  updateUser: RequestHandler;
}

export const createUserController = (deps: {
  userUseCases: Pick<UserUseCases, 'createUser' | 'listTechnicians' | 'getUserById' | 'updateUser'>;
}): UserController => {
  const createUser = asyncHandler(async (request, response) => {
    const data = await deps.userUseCases.createUser({
      name: parseRequiredString(request.body?.name, 'Name is required'),
      email: parseRequiredString(request.body?.email, 'Email is required'),
      password: parseRequiredString(request.body?.password, 'Password is required'),
      role: parseOptionalUserRole(request.body?.role),
      isTechnician: parseOptionalBoolean(
        request.body?.isTechnician,
        'isTechnician must be a boolean',
      ),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(201).json({ data });
  });

  const listTechnicians = asyncHandler(async (_request, response) => {
    const data = await deps.userUseCases.listTechnicians();
    response.status(200).json({ data });
  });

  const getUserById = asyncHandler(async (request, response) => {
    const data = await deps.userUseCases.getUserById(
      parseRequiredString(request.params.id, 'User id is required'),
    );
    response.status(200).json({ data });
  });

  const updateUser = asyncHandler(async (request, response) => {
    const data = await deps.userUseCases.updateUser({
      id: parseRequiredString(request.params.id, 'User id is required'),
      name: typeof request.body?.name === 'string' ? request.body.name : undefined,
      email: typeof request.body?.email === 'string' ? request.body.email : undefined,
      isTechnician: parseOptionalBoolean(
        request.body?.isTechnician,
        'isTechnician must be a boolean',
      ),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(200).json({ data });
  });

  return {
    createUser,
    listTechnicians,
    getUserById,
    updateUser,
  };
};
