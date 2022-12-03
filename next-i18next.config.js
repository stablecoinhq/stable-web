/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: Object.keys(require('./languages.config')),
  },
  localePath: require('path').resolve('./public/locales'),
};
