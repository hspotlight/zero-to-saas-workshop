module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['__tests__/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'public/**/*.js',
    '!public/firebase-config.js',
    '!public/config/**',
  ],
};
