import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/roles';
import { verifyAccessToken } from '../utils/tokens';
import { User } from '../models/User';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Missing token.');
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is invalid or deactivated.');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hospitalId: user.hospitalId ? user.hospitalId.toString() : null,
      branchId: user.branchId ? user.branchId.toString() : null,
      isEmailVerified: user.isVerified ?? false,
    };

    req.tenantId = user.hospitalId ? user.hospitalId.toString() : null;
    req.branchId = user.branchId ? user.branchId.toString() : null;

    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired authentication token.'));
    }
    next(err);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).exec();
        if (user && user.isActive) {
          req.user = {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            hospitalId: user.hospitalId ? user.hospitalId.toString() : null,
            branchId: user.branchId ? user.branchId.toString() : null,
            isEmailVerified: user.isVerified ?? false,
          };
          req.tenantId = user.hospitalId ? user.hospitalId.toString() : null;
          req.branchId = user.branchId ? user.branchId.toString() : null;
        }
      } catch {
        // Ignore token errors in optionalAuth
      }
    }
    next();
  } catch (err) {
    next();
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden. Role '${req.user.role}' is not authorized for this resource.`
        )
      );
    }

    next();
  };
};

export const requireHospitalAccess = (
  getHospitalId: (req: Request) => string | undefined | null = (req) =>
    (req.headers['x-hospital-id'] as string) || req.params.hospitalId || req.body.hospitalId
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    const targetHospitalId = getHospitalId(req);

    if (!targetHospitalId) {
      return next(new ForbiddenError('Tenant scope missing. Hospital ID required.'));
    }

    if (req.user.hospitalId !== targetHospitalId) {
      return next(
        new ForbiddenError(
          `Cross-tenant access denied. User from hospital '${req.user.hospitalId}' cannot access data of hospital '${targetHospitalId}'.`
        )
      );
    }

    next();
  };
};

export const requireBranchAccess = (
  getBranchId: (req: Request) => string | undefined | null = (req) =>
    (req.headers['x-branch-id'] as string) || req.params.branchId || req.body.branchId
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    if (req.user.role === Role.HOSPITAL_ADMIN) {
      return next();
    }

    const targetBranchId = getBranchId(req);

    if (!targetBranchId) {
      return next(new ForbiddenError('Branch scope missing. Branch ID required.'));
    }

    if (req.user.branchId !== targetBranchId) {
      return next(
        new ForbiddenError(
          `Cross-branch access denied. User assigned to branch '${req.user.branchId}' cannot access branch '${targetBranchId}'.`
        )
      );
    }

    next();
  };
};
