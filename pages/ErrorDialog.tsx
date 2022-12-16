/* eslint-disable i18next/no-literal-string */
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

const ErrorDialog: FC<{ message: string; resetError: () => void; error: Error | null }> = ({ message, resetError, error }) => {
  const { t } = useTranslation('common', { keyPrefix: 'error' });

  const handleClose = useCallback(() => {
    resetError();
  }, [resetError]);

  return (
    <Dialog open={!!error} onClose={handleClose}>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
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
