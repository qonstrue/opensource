/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest'],
  },
  transformIgnorePatterns: ['/node_modules/(?!unified)/', '/unified/'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  passWithNoTests: true,
};
