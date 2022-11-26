/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  localePath: require('path').resolve('./public/locales'),
};
