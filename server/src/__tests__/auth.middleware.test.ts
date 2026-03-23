import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

const JWT_SECRET = 'test_secret';
process.env.JWT_SECRET = JWT_SECRET;

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('authenticateToken middleware', () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('calls next() with valid token', () => {
    const token = jwt.sign({ id: '1', email: 'a@b.com', role: 'MEMBER' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    authenticateToken(req as any, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when token is missing', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    authenticateToken(req as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const token = jwt.sign({ id: '1', email: 'a@b.com', role: 'MEMBER' }, JWT_SECRET, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    authenticateToken(req as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when token is invalid', () => {
    const req = { headers: { authorization: 'Bearer bad.token.here' } } as Request;
    const res = mockRes();
    authenticateToken(req as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
