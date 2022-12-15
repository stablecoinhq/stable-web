/* eslint-disable i18next/no-literal-string */
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { FallbackProps } from 'react-error-boundary';

const ErrorDialog: FC<{ props: FallbackProps }> = ({ props }) => {
  const { t } = useTranslation('common', { keyPrefix: 'error' });
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    props.resetErrorBoundary();
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('errorOccured')}: {props.error.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleClose}>
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDialog;
