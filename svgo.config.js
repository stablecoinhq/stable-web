module.exports = {
  plugins: [
    'preset-default',
    {
      name: 'removeUnknownsAndDefaults',
      params: {
        keepDataAttrs: false,
      },
    },
  ],
};
