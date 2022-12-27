// https://nimblewebdeveloper.com/blog/react-context-provider-hook-pattern

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  styled,
  Typography,
} from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IconButtonProps } from '@mui/material';
import type { FC, ReactNode } from 'react';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const { expand, ...other } = props;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginRight: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

export type ErrorDialogContextType = {
  openDialog: (message: string, error: Error, onClose?: () => void) => void;
};

const ErrorDialogContext = createContext<ErrorDialogContextType>({
  openDialog: (_s) => {},
});

export const useErrorDialog = () => useContext(ErrorDialogContext);

export const ErrorDialogProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [displayDialog, setDisplayDialog] = useState(false);
  const [runOnClosed, setRunOnClosed] = useState<() => void>(() => {});
  const [errorMessage, setErrorMessage] = useState<null | Error>(null);

  const [dialogMessage, setDialogMessage] = useState('');
  const [expandCollapse, setExpandCollapse] = useState(false);
  const { t } = useTranslation('common');

  const openDialog = useCallback(
    (message: string, error: Error, onClose?: () => void) => {
      if (!displayDialog) {
        setDisplayDialog(true);
        setExpandCollapse(false);
        setErrorMessage(error);
        setDialogMessage(message);
        if (onClose !== undefined) {
          setRunOnClosed(() => onClose);
        }
      }
    },
    [displayDialog],
  );
  const handleClose = useCallback(() => {
    setDisplayDialog(false);
    // 一定時間後に初期化しないと、空のDialogが一瞬表示される
    setTimeout(() => {
      setDialogMessage('');
      setExpandCollapse(false);
      setErrorMessage(null);
      if (runOnClosed) {
        runOnClosed();
      }
      setRunOnClosed(() => {});
    }, 1000);
  }, [runOnClosed]);

  const value: ErrorDialogContextType = useMemo(() => ({ openDialog }), [openDialog]);

  return (
    <ErrorDialogContext.Provider value={value}>
      <Dialog open={displayDialog} fullWidth onClose={handleClose}>
        <DialogTitle>{t('error.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <ExpandMore expand={expandCollapse} onClick={() => setExpandCollapse((prev) => !prev)} aria-label="show more">
            <ExpandMoreIcon />
          </ExpandMore>
          <Button variant="contained" onClick={handleClose}>
            {t('close')}
          </Button>
        </DialogActions>
        <Collapse in={expandCollapse} timeout="auto" unmountOnExit>
          <DialogContent>
            <Typography paragraph>{errorMessage?.message}</Typography>
          </DialogContent>
        </Collapse>
      </Dialog>
      {children}
    </ErrorDialogContext.Provider>
  );
};
