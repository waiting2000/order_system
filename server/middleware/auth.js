import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'family-menu-secret-change-in-production';

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, nickname: user.nickname },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Auth middleware — validates JWT and attaches user to req
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}
