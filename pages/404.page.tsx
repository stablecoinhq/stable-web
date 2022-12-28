import Error from 'next/error';
import { useTranslation } from 'react-i18next';

import getTranslationProps from './getTranslationProps';

import type { NextPage } from 'next';

const NotFound: NextPage = () => {
  const { t } = useTranslation('common', { keyPrefix: 'notFound' });

  return <Error statusCode={404} title={t('title')!} />;
};

export const getStaticProps = getTranslationProps;
export default NotFound;
