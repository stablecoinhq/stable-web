import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import type { GetStaticProps } from 'next';
import type { SSRConfig } from 'next-i18next';

const getTranslationProps: GetStaticProps<SSRConfig> = async ({ locale }) => ({
  props: await serverSideTranslations(locale!, ['common']),
});

export default getTranslationProps;
