module.exports = {
  "roots": [ "<rootDir>/src" ],
  "transform": { "^.+\\.ts$": "ts-jest" },

  // @todo(sfount) remove custom mathcher once all mocha tests have been replaced
  "testMatch": [ "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)" ]
}
