import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

const LEAVE_SERVICE_URL = (process.env.LEAVE_SERVICE_URL || 'http://leave-service:9090').replace(/\/$/, '');
const USER_SERVICE_URL = (process.env.USER_SERVICE_URL || 'http://user-service:9090').replace(/\/$/, '');

// Proxy /api/leave/* → leave-service
app.use('/api/leave', createProxyMiddleware({
  target: LEAVE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/leave': '' },
}));

// Proxy /api/user/* → user-service
app.use('/api/user', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/user': '' },
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve static SPA
const DIST = path.join(__dirname, '..', 'dist');
app.use(express.static(DIST));
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`leave-web-app listening on port ${PORT}`);
  console.log(`  LEAVE_SERVICE_URL = ${LEAVE_SERVICE_URL}`);
  console.log(`  USER_SERVICE_URL  = ${USER_SERVICE_URL}`);
});
