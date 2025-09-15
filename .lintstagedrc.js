module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'eslint'
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write'
  ]
};