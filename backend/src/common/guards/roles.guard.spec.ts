import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '../enums/role.enum.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required on the endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ role: Role.PATIENT });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when PATIENT attempts to access endpoint requiring [ADMIN, DOCTOR]', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.DOCTOR]);
    const context = createMockContext({ id: 'user-123', role: Role.PATIENT });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      "Access denied: Required role(s) [ADMIN, DOCTOR] but user has role 'PATIENT'",
    );
  });

  it('should allow access when ADMIN accesses endpoint requiring [ADMIN, DOCTOR]', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.DOCTOR]);
    const context = createMockContext({ id: 'admin-123', role: Role.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when DOCTOR accesses endpoint requiring [ADMIN, DOCTOR]', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.DOCTOR]);
    const context = createMockContext({ id: 'doc-123', role: Role.DOCTOR });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow PATIENT access to endpoint requiring [PATIENT]', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PATIENT]);
    const context = createMockContext({ id: 'pat-123', role: Role.PATIENT });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user object has no role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Access denied: User has no valid role');
  });
});
