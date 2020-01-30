module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": ["eslint:recommended", "airbnb-base"],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "rules": {
    "indent": ["error", 2],
    "arrow-parens": [0],
    "no-await-in-loop": [0],
    "no-param-reassign": [0],
    "no-plusplus": [0],
    "quotes": [2, "single"],
    "vars-on-top": [0],
    "no-underscore-dangle": ["error", { "allow": ["_id"] }]
  }
};
