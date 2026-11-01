module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
};
