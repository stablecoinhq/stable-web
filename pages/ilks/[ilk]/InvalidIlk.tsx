import { Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

const InvalidIlk: FC = () => {
  const { t } = useTranslation('common', { keyPrefix: 'pages.ilk' });

  return (
    <Stack direction="column" alignItems="center" padding={2}>
      <Typography variant="h6" component="div" padding={2}>
        {t('unableToLoadCollateral')}
      </Typography>
      <Link href="/ilks" passHref>
        <Button variant="contained">{t('backToList')}</Button>
      </Link>
    </Stack>
  );
};

export default InvalidIlk;
