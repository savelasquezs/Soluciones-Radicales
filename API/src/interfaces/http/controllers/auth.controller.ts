import { RequestHandler } from 'express';
import type { createAuthUseCases } from '../../../application/auth/auth.usecases';
import { asyncHandler, parseRequiredString } from '../request.utils';

type AuthUseCases = ReturnType<typeof createAuthUseCases>;

export const createAuthController = (deps: {
  authUseCases: Pick<
    AuthUseCases,
    | 'login'
    | 'refreshToken'
    | 'logout'
    | 'getCurrentUser'
    | 'changePassword'
    | 'requestPasswordReset'
    | 'resetPassword'
  >;
}): Record<string, RequestHandler> => {
  const login = asyncHandler(async (request, response) => {
    const data = await deps.authUseCases.login({
      email: parseRequiredString(request.body?.email, 'Email is required'),
      password: parseRequiredString(request.body?.password, 'Password is required'),
    });

    response.status(200).json({ data });
  });

  const refreshToken = asyncHandler(async (request, response) => {
    const data = await deps.authUseCases.refreshToken({
      refreshToken: parseRequiredString(
        request.body?.refreshToken,
        'Refresh token is required',
      ),
    });

    response.status(200).json({ data });
  });

  const logout = asyncHandler(async (request, response) => {
    const data = await deps.authUseCases.logout({
      refreshToken: parseRequiredString(
        request.body?.refreshToken,
        'Refresh token is required',
      ),
    });

    response.status(200).json({ data });
  });

  const getCurrentUser = asyncHandler(async (request, response) => {
    const data = await deps.authUseCases.getCurrentUser(
      parseRequiredString(request.user?.userId, 'User id is required'),
    );

    response.status(200).json({ data });
  });

  const changePassword = asyncHandler(async (request, response) => {
    const data = await deps.authUseCases.changePassword({
      userId: parseRequiredString(request.user?.userId, 'User id is required'),
      currentPassword: parseRequiredString(
        request.body?.currentPassword,
        'Current password is required',
      ),
      newPassword: parseRequiredString(request.body?.newPassword, 'New password is required'),
    });

    response.status(200).json({ data });
  });

  const forgotPassword = asyncHandler(async (request, response) => {
    const data = await deps.authUseCases.requestPasswordReset({
      email: parseRequiredString(request.body?.email, 'Email is required'),
    });

    response.status(200).json(data);
  });

  const resetPassword = asyncHandler(async (request, response) => {
    const data = await deps.authUseCases.resetPassword({
      token: parseRequiredString(request.body?.token, 'Token is required'),
      newPassword: parseRequiredString(request.body?.newPassword, 'New password is required'),
    });

    response.status(200).json({ data });
  });

  return {
    login,
    refreshToken,
    logout,
    getCurrentUser,
    changePassword,
    forgotPassword,
    resetPassword,
  };
};
