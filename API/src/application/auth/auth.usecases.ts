import { UserRole } from '../../domain/entities';
import {
  ActivityLogRepository,
  PasswordResetTokenRepository,
  RefreshTokenRepository,
  UserRepository,
} from '../../domain/repositories';
import { env } from '../../infrastructure/config/env';
import { NotFoundError, ValidationError } from '../errors';
import { UserPublic } from '../users/user.types';
import {
  AuthOutput,
  ChangePasswordInput,
  LoginInput,
  RefreshTokenInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from './auth.types';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If the email exists, password reset instructions were sent';
const MIN_NEW_PASSWORD_LENGTH = 8;

interface JwtServicePayload {
  userId: string;
  role: UserRole;
  isTechnician: boolean;
}

interface AuthUseCasesDeps {
  userRepository: UserRepository;
  refreshTokenRepository: RefreshTokenRepository;
  passwordResetTokenRepository: PasswordResetTokenRepository;
  passwordService: {
    compare(plainText: string, passwordHash: string): Promise<boolean>;
    hash(value: string): Promise<string>;
  };
  jwtService: {
    signAccessToken(payload: JwtServicePayload): string;
    signRefreshToken(payload: JwtServicePayload): string;
    verifyRefreshToken(token: string): JwtServicePayload;
  };
  tokenHashService: {
    hashToken(token: string): string;
    generateRandomToken(): string;
  };
  emailService: {
    sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void>;
  };
  activityLogRepository?: ActivityLogRepository;
}

const toPublicUser = (user: {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  isTechnician: boolean;
  active: boolean;
  disabledAt: Date | null;
  createdAt: Date;
}): UserPublic => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isTechnician: user.isTechnician,
  active: user.active,
  disabledAt: user.disabledAt,
  createdAt: user.createdAt,
});

const assertNonEmpty = (value: string | undefined | null, message: string) => {
  if (!value?.trim()) {
    throw new ValidationError(message);
  }
};

const buildUserTokenPayload = (user: {
  id: string;
  role: UserRole;
  isTechnician: boolean;
}): JwtServicePayload => ({
  userId: user.id,
  role: user.role,
  isTechnician: user.isTechnician,
});

export const createAuthUseCases = (deps: AuthUseCasesDeps) => {
  const logActivity = async (
    action: string,
    entity: string,
    entityId: string,
    userId?: string | null,
  ) => {
    if (!deps.activityLogRepository) {
      return;
    }

    await deps.activityLogRepository.create({
      userId: userId ?? null,
      action,
      entity,
      entityId,
    });
  };

  const issueTokens = async (user: {
    id: string;
    role: UserRole;
    isTechnician: boolean;
  }) => {
    const payload = buildUserTokenPayload(user);
    const accessToken = deps.jwtService.signAccessToken(payload);
    const refreshToken = deps.jwtService.signRefreshToken(payload);
    const refreshTokenHash = deps.tokenHashService.hashToken(refreshToken);
    const refreshExpiresAt = new Date(
      Date.now() + msFromExpiresIn(env.auth.jwtRefreshExpiresIn),
    );

    await deps.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  };

  const login = async (input: LoginInput): Promise<AuthOutput> => {
    assertNonEmpty(input.email, 'Email is required');
    assertNonEmpty(input.password, 'Password is required');

    const user = await deps.userRepository.findByEmail(input.email.trim());
    if (!user) {
      throw new ValidationError(INVALID_CREDENTIALS_MESSAGE);
    }

    const isValidPassword = await deps.passwordService.compare(
      input.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new ValidationError(INVALID_CREDENTIALS_MESSAGE);
    }

    const tokens = await issueTokens(user);
    return {
      user: toPublicUser(user),
      tokens,
    };
  };

  const refreshToken = async (input: RefreshTokenInput): Promise<AuthOutput> => {
    assertNonEmpty(input.refreshToken, 'Refresh token is required');

    let decodedPayload: JwtServicePayload;
    try {
      decodedPayload = deps.jwtService.verifyRefreshToken(input.refreshToken);
    } catch {
      throw new ValidationError('Invalid refresh token');
    }

    const currentHash = deps.tokenHashService.hashToken(input.refreshToken);
    const currentToken = await deps.refreshTokenRepository.findByHash(currentHash);
    if (!currentToken) {
      throw new ValidationError('Invalid refresh token');
    }

    if (currentToken.revokedAt || currentToken.expiresAt.getTime() <= Date.now()) {
      throw new ValidationError('Refresh token revoked or expired');
    }

    const user = await deps.userRepository.findById(decodedPayload.userId);
    if (!user) {
      throw new NotFoundError(`User not found: ${decodedPayload.userId}`);
    }

    await deps.refreshTokenRepository.revokeByHash(currentHash);
    const tokens = await issueTokens(user);

    return {
      user: toPublicUser(user),
      tokens,
    };
  };

  const logout = async (input: { refreshToken: string }) => {
    assertNonEmpty(input.refreshToken, 'Refresh token is required');

    const hash = deps.tokenHashService.hashToken(input.refreshToken);
    await deps.refreshTokenRepository.revokeByHash(hash);

    return { success: true };
  };

  const getCurrentUser = async (userId: string): Promise<UserPublic> => {
    assertNonEmpty(userId, 'User id is required');

    const user = await deps.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`);
    }

    return toPublicUser(user);
  };

  const changePassword = async (input: ChangePasswordInput) => {
    assertNonEmpty(input.userId, 'User id is required');
    assertNonEmpty(input.currentPassword, 'Current password is required');
    assertNonEmpty(input.newPassword, 'New password is required');

    if (input.newPassword.length < MIN_NEW_PASSWORD_LENGTH) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    const user = await deps.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError(`User not found: ${input.userId}`);
    }

    const isCurrentPasswordValid = await deps.passwordService.compare(
      input.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new ValidationError(INVALID_CREDENTIALS_MESSAGE);
    }

    const newPasswordHash = await deps.passwordService.hash(input.newPassword);
    await deps.userRepository.updatePassword(input.userId, newPasswordHash);
    await deps.refreshTokenRepository.revokeAllByUserId(input.userId);
    await logActivity('password_changed', 'user', user.id, user.id);

    return { success: true };
  };

  const requestPasswordReset = async (input: RequestPasswordResetInput) => {
    assertNonEmpty(input.email, 'Email is required');

    const normalizedEmail = input.email.trim();
    const user = await deps.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      return {
        message: GENERIC_FORGOT_PASSWORD_MESSAGE,
      };
    }

    const plainToken = deps.tokenHashService.generateRandomToken();
    const tokenHash = deps.tokenHashService.hashToken(plainToken);
    const expiresAt = new Date(
      Date.now() + env.auth.passwordResetExpiresMinutes * 60 * 1000,
    );

    await deps.passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${env.auth.frontendResetPasswordUrl}?token=${encodeURIComponent(plainToken)}`;
    await deps.emailService.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    return {
      message: GENERIC_FORGOT_PASSWORD_MESSAGE,
    };
  };

  const resetPassword = async (input: ResetPasswordInput) => {
    assertNonEmpty(input.token, 'Token is required');
    assertNonEmpty(input.newPassword, 'New password is required');
    if (input.newPassword.length < MIN_NEW_PASSWORD_LENGTH) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    const tokenHash = deps.tokenHashService.hashToken(input.token);
    const resetToken = await deps.passwordResetTokenRepository.findByHash(tokenHash);

    if (!resetToken) {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const user = await deps.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new NotFoundError(`User not found: ${resetToken.userId}`);
    }

    const newPasswordHash = await deps.passwordService.hash(input.newPassword);
    await deps.userRepository.updatePassword(user.id, newPasswordHash);
    await deps.passwordResetTokenRepository.markAsUsed(tokenHash);
    await deps.refreshTokenRepository.revokeAllByUserId(user.id);
    await logActivity('password_reset', 'user', user.id, user.id);

    return { success: true };
  };

  return {
    login,
    refreshToken,
    logout,
    getCurrentUser,
    changePassword,
    requestPasswordReset,
    resetPassword,
  };
};

const msFromExpiresIn = (value: string): number => {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === 's') {
    return amount * 1000;
  }
  if (unit === 'm') {
    return amount * 60 * 1000;
  }
  if (unit === 'h') {
    return amount * 60 * 60 * 1000;
  }

  return amount * 24 * 60 * 60 * 1000;
};
