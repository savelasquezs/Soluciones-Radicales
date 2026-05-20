import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError, ValidationError } from '../../errors';
import { createAuthUseCases } from '../auth.usecases';

const baseUser = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@test.com',
  password: 'hashed-password',
  role: 'admin' as const,
  isTechnician: true,
  active: true,
  disabledAt: null,
  createdAt: new Date(),
};

const buildDeps = () => {
  const userRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
    listUsers: vi.fn(),
    listTechnicians: vi.fn(),
    disableUser: vi.fn(),
  };
  const refreshTokenRepository = {
    create: vi.fn(),
    findByHash: vi.fn(),
    revokeByHash: vi.fn(),
    revokeAllByUserId: vi.fn(),
  };
  const passwordResetTokenRepository = {
    create: vi.fn(),
    findByHash: vi.fn(),
    markAsUsed: vi.fn(),
    deleteExpired: vi.fn(),
  };
  const passwordService = {
    compare: vi.fn(),
    hash: vi.fn(),
  };
  const jwtService = {
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };
  const tokenHashService = {
    hashToken: vi.fn(),
    generateRandomToken: vi.fn(),
  };
  const emailService = {
    sendPasswordResetEmail: vi.fn(),
  };
  const activityLogRepository = {
    create: vi.fn(),
  };

  return {
    userRepository,
    refreshTokenRepository,
    passwordResetTokenRepository,
    passwordService,
    jwtService,
    tokenHashService,
    emailService,
    activityLogRepository,
  };
};

describe('auth usecases', () => {
  const now = new Date('2026-05-05T00:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  it('login exitoso retorna usuario publico, accessToken y refreshToken', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(baseUser);
    deps.passwordService.compare.mockResolvedValue(true);
    deps.jwtService.signAccessToken.mockReturnValue('access-token');
    deps.jwtService.signRefreshToken.mockReturnValue('refresh-token');
    deps.tokenHashService.hashToken.mockReturnValue('refresh-hash');
    deps.refreshTokenRepository.create.mockResolvedValue({});

    const useCases = createAuthUseCases(deps);
    const result = await useCases.login({
      email: baseUser.email,
      password: 'password',
    });

    expect(result.user.email).toBe(baseUser.email);
    expect(result.user).not.toHaveProperty('password');
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('login falla con credenciales invalidas', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(baseUser);
    deps.passwordService.compare.mockResolvedValue(false);
    const useCases = createAuthUseCases(deps);

    await expect(
      useCases.login({
        email: baseUser.email,
        password: 'invalid',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('refreshToken exitoso rota refresh token', async () => {
    const deps = buildDeps();
    deps.jwtService.verifyRefreshToken.mockReturnValue({
      userId: baseUser.id,
      role: baseUser.role,
      isTechnician: baseUser.isTechnician,
    });
    deps.tokenHashService.hashToken.mockReturnValue('old-hash');
    deps.refreshTokenRepository.findByHash.mockResolvedValue({
      id: 'rt-1',
      userId: baseUser.id,
      tokenHash: 'old-hash',
      expiresAt: new Date('2026-05-10T00:00:00.000Z'),
      revokedAt: null,
      createdAt: now,
    });
    deps.userRepository.findById.mockResolvedValue(baseUser);
    deps.jwtService.signAccessToken.mockReturnValue('new-access');
    deps.jwtService.signRefreshToken.mockReturnValue('new-refresh');
    deps.refreshTokenRepository.create.mockResolvedValue({});

    const useCases = createAuthUseCases(deps);
    const result = await useCases.refreshToken({
      refreshToken: 'old-refresh',
    });

    expect(deps.refreshTokenRepository.revokeByHash).toHaveBeenCalledWith('old-hash');
    expect(result.tokens).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('refreshToken falla si token esta revocado', async () => {
    const deps = buildDeps();
    deps.jwtService.verifyRefreshToken.mockReturnValue({
      userId: baseUser.id,
      role: baseUser.role,
      isTechnician: baseUser.isTechnician,
    });
    deps.tokenHashService.hashToken.mockReturnValue('old-hash');
    deps.refreshTokenRepository.findByHash.mockResolvedValue({
      id: 'rt-1',
      userId: baseUser.id,
      tokenHash: 'old-hash',
      expiresAt: new Date('2026-05-10T00:00:00.000Z'),
      revokedAt: new Date('2026-05-05T00:00:00.000Z'),
      createdAt: now,
    });

    const useCases = createAuthUseCases(deps);
    await expect(
      useCases.refreshToken({
        refreshToken: 'old-refresh',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('logout revoca refresh token', async () => {
    const deps = buildDeps();
    deps.tokenHashService.hashToken.mockReturnValue('hash');
    const useCases = createAuthUseCases(deps);

    const result = await useCases.logout({
      refreshToken: 'refresh',
    });

    expect(result).toEqual({ success: true });
    expect(deps.refreshTokenRepository.revokeByHash).toHaveBeenCalledWith('hash');
  });

  it('getCurrentUser retorna usuario publico', async () => {
    const deps = buildDeps();
    deps.userRepository.findById.mockResolvedValue(baseUser);
    const useCases = createAuthUseCases(deps);

    const user = await useCases.getCurrentUser(baseUser.id);

    expect(user.id).toBe(baseUser.id);
    expect(user).not.toHaveProperty('password');
  });

  it('getCurrentUser lanza NotFoundError si no existe', async () => {
    const deps = buildDeps();
    deps.userRepository.findById.mockResolvedValue(null);
    const useCases = createAuthUseCases(deps);

    await expect(useCases.getCurrentUser(baseUser.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('changePassword falla si contraseña actual es invalida', async () => {
    const deps = buildDeps();
    deps.userRepository.findById.mockResolvedValue(baseUser);
    deps.passwordService.compare.mockResolvedValue(false);
    const useCases = createAuthUseCases(deps);

    await expect(
      useCases.changePassword({
        userId: baseUser.id,
        currentPassword: 'wrong',
        newPassword: 'newpassword',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('changePassword actualiza password y revoca refresh tokens', async () => {
    const deps = buildDeps();
    deps.userRepository.findById.mockResolvedValue(baseUser);
    deps.passwordService.compare.mockResolvedValue(true);
    deps.passwordService.hash.mockResolvedValue('new-hash');
    const useCases = createAuthUseCases(deps);

    const result = await useCases.changePassword({
      userId: baseUser.id,
      currentPassword: 'ok',
      newPassword: 'newpassword',
    });

    expect(result).toEqual({ success: true });
    expect(deps.userRepository.updatePassword).toHaveBeenCalledWith(baseUser.id, 'new-hash');
    expect(deps.refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(baseUser.id);
  });

  it('requestPasswordReset retorna mensaje generico aunque email no exista', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(null);
    const useCases = createAuthUseCases(deps);

    const result = await useCases.requestPasswordReset({
      email: 'missing@test.com',
    });

    expect(result.message).toBe('If the email exists, password reset instructions were sent');
  });

  it('requestPasswordReset crea token y llama email service si email existe', async () => {
    const deps = buildDeps();
    deps.userRepository.findByEmail.mockResolvedValue(baseUser);
    deps.tokenHashService.generateRandomToken.mockReturnValue('plain-token');
    deps.tokenHashService.hashToken.mockReturnValue('token-hash');
    const useCases = createAuthUseCases(deps);

    const result = await useCases.requestPasswordReset({
      email: baseUser.email,
    });

    expect(result.message).toBe('If the email exists, password reset instructions were sent');
    expect(deps.passwordResetTokenRepository.create).toHaveBeenCalled();
    expect(deps.emailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('resetPassword falla si token esta expirado o usado', async () => {
    const deps = buildDeps();
    deps.tokenHashService.hashToken.mockReturnValue('token-hash');
    deps.passwordResetTokenRepository.findByHash.mockResolvedValue({
      id: 'prt-1',
      userId: baseUser.id,
      tokenHash: 'token-hash',
      expiresAt: new Date('2026-05-04T00:00:00.000Z'),
      usedAt: null,
      createdAt: now,
    });
    const useCases = createAuthUseCases(deps);

    await expect(
      useCases.resetPassword({
        token: 'plain-token',
        newPassword: 'newpassword',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('resetPassword actualiza password, marca token usado y revoca refresh tokens', async () => {
    const deps = buildDeps();
    deps.tokenHashService.hashToken.mockReturnValue('token-hash');
    deps.passwordResetTokenRepository.findByHash.mockResolvedValue({
      id: 'prt-1',
      userId: baseUser.id,
      tokenHash: 'token-hash',
      expiresAt: new Date('2026-05-10T00:00:00.000Z'),
      usedAt: null,
      createdAt: now,
    });
    deps.userRepository.findById.mockResolvedValue(baseUser);
    deps.passwordService.hash.mockResolvedValue('new-hash');
    const useCases = createAuthUseCases(deps);

    const result = await useCases.resetPassword({
      token: 'plain-token',
      newPassword: 'newpassword',
    });

    expect(result).toEqual({ success: true });
    expect(deps.userRepository.updatePassword).toHaveBeenCalledWith(baseUser.id, 'new-hash');
    expect(deps.passwordResetTokenRepository.markAsUsed).toHaveBeenCalledWith('token-hash');
    expect(deps.refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(baseUser.id);
  });
});
