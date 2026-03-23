import { Response, NextFunction } from 'express';
import { authorizeRole } from '../middleware/auth';
import { AuthRequest, Role } from '../middleware/auth';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(role: Role): AuthRequest {
  return { user: { id: '1', email: 'a@b.com', role } } as AuthRequest;
}

describe('authorizeRole middleware', () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('allows ADMIN to access ADMIN-only route', () => {
    const middleware = authorizeRole(['ADMIN']);
    middleware(makeReq('ADMIN'), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks MEMBER from ADMIN-only route', () => {
    const middleware = authorizeRole(['ADMIN']);
    const res = mockRes();
    middleware(makeReq('MEMBER'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks VIEWER from MEMBER+ route', () => {
    const middleware = authorizeRole(['ADMIN', 'MEMBER']);
    const res = mockRes();
    middleware(makeReq('VIEWER'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows MEMBER to access MEMBER route', () => {
    const middleware = authorizeRole(['ADMIN', 'MEMBER']);
    middleware(makeReq('MEMBER'), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when no user on request', () => {
    const middleware = authorizeRole(['ADMIN']);
    const req = {} as AuthRequest;
    const res = mockRes();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
