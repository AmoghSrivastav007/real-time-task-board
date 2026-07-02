// Quick test to show what CORS origins will be allowed
// Run this with: node test-cors-config.js

// Simulate environment variables
const env = {
  CLIENT_URL: 'https://real-time-task-board-web-ujjn.vercel.app',
  SOCKET_CORS_ORIGIN: 'https://real-time-task-board-web-ujjn.vercel.app',
};

// Same logic as server/src/index.ts
const allowedOrigins = [
  ...new Set(
    [
      env.CLIENT_URL,
      env.SOCKET_CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:3001',
    ]
      .filter(Boolean)
      .map((o) => o.replace(/\/$/, ''))
  ),
];

console.log('✅ Allowed CORS origins:');
allowedOrigins.forEach(origin => console.log(`   - ${origin}`));

console.log('\n📝 Test cases:');
const testOrigins = [
  'http://localhost:3000',
  'https://real-time-task-board-web-ujjn.vercel.app',
  'https://real-time-task-board-web-ujjn.vercel.app/',
  'http://localhost:3001',
  'https://example.com',
];

function isAllowed(origin) {
  if (!origin) return true;
  return allowedOrigins.includes(origin.replace(/\/$/, ''));
}

testOrigins.forEach(origin => {
  const allowed = isAllowed(origin);
  const icon = allowed ? '✅' : '❌';
  console.log(`   ${icon} ${origin}`);
});
