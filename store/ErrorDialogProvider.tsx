// https://nimblewebdeveloper.com/blog/react-context-provider-hook-pattern

import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

export type ErrorDialogContextType = {
  openDialog: (message: string, onClose?: () => void) => void;
  closeModal?: () => void;
};

const ErrorDialogContext = createContext<ErrorDialogContextType>({
  openDialog: (_s) => {},
  closeModal: () => {},
});

export const useErrorDialog = () => useContext(ErrorDialogContext);

export const ErrorDialogProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [displayDialog, setDisplayDialog] = useState(false);
  const [runOnClosed, setRunOnClosed] = useState<() => void>(() => {});
  const [dialogMessage, setDialogMessage] = useState('');
  const { t } = useTranslation('common', { keyPrefix: 'error' });

  const openDialog = useCallback((message: string, onClose?: () => void) => {
    setDisplayDialog(true);
    setDialogMessage(message);
    if (onClose !== undefined) {
      setRunOnClosed(() => onClose);
    }
  }, []);
  const closeModal = useCallback(() => {
    setDisplayDialog(false);
    setDialogMessage('');
    if (runOnClosed) {
      runOnClosed();
    }
    setRunOnClosed(() => {});
  }, [runOnClosed]);
  const value: ErrorDialogContextType = useMemo(() => ({ openDialog, closeModal }), [closeModal, openDialog]);

  return (
    <ErrorDialogContext.Provider value={value}>
      <Box display="flex" justifyContent="center" padding={2}>
        <Dialog open={displayDialog}>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogContent>
            <DialogContentText>{dialogMessage}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={closeModal}>
              {t('close')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {children}
    </ErrorDialogContext.Provider>
  );
};
