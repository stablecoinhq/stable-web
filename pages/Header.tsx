import { AppBar, FormControlLabel, Switch, Toolbar, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useCallback } from 'react';

import MetaMaskButton from 'ethereum/react/MetaMaskButton';
import { useConfigContext } from 'store/DisplayProvider';

import LanguagePicker from './LanguagePicker';

import type { ChangeEventHandler, FC } from 'react';
import type { WithNullableEthereum } from 'types/next';

const Header: FC<WithNullableEthereum> = ({ externalProvider, provider }) => {
  const { t } = useTranslation('common', { keyPrefix: 'site' });
  const { unit, toggleDisplayUnit } = useConfigContext();
  const onToggle: ChangeEventHandler<HTMLInputElement> = useCallback(() => {
    toggleDisplayUnit();
  }, [toggleDisplayUnit]);
  return (
    <AppBar position="static">
      <Toolbar>
        <Link href="/">
          <Typography variant="h5" component="div" flexGrow={1} style={{ cursor: 'pointer' }}>
            {t('title')}
          </Typography>
        </Link>
        <FormControlLabel
          control={<Switch checked={unit === 'detailed'} onChange={onToggle} name="unit" color="default" />}
          label="詳細表示"
        />
        <LanguagePicker sx={{ mr: 2 }} />
        <MetaMaskButton externalProvider={externalProvider} provider={provider} />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
