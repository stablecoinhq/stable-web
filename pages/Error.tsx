import { Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { FallbackProps } from 'react-error-boundary';

const Error: FC<{ props: FallbackProps }> = ({ props }) => {
  const { t } = useTranslation('common', { keyPrefix: 'error' });
  const router = useRouter();

  return (
    <Stack direction="column" alignItems="center" padding={2}>
      <Typography variant="h6" component="div" padding={2}>
        {props.error.message}
      </Typography>
      <Button variant="contained" onClick={() => router.back()}>
        {t('back')}
      </Button>
    </Stack>
  );
};

export default Error;
