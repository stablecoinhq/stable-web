/* eslint-disable i18next/no-literal-string */
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { FallbackProps } from 'react-error-boundary';

const ErrorDialog: FC<{ props: FallbackProps; message: string }> = ({ props, message }) => {
  const { t } = useTranslation('common', { keyPrefix: 'error' });
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => {
    props.resetErrorBoundary();
    setOpen(true);
  }, [props]);

  return (
    <Dialog open={open} onClose={handleClose}>
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
