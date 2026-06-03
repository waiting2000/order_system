import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const random = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  未设置 JWT_SECRET 环境变量，使用随机密钥（服务重启后所有用户需重新登录）');
  console.warn('   生产环境建议: export JWT_SECRET="你的随机字符串"');
  return random;
})();

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
