import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

export type ProgressDialogProps = {
  open: boolean;
  title: ReactNode;
  text: string;
  totalStep: number;
  currentStep: number;
  onClose: () => void;
};
const ProgressDialog: FC<ProgressDialogProps> = ({ title, text, totalStep, currentStep, onClose, open }) => {
  const { t } = useTranslation('common');
  const currentProgress = useMemo(() => (currentStep / totalStep) * 100, [currentStep, totalStep]);
  const isInProgress = useMemo(() => currentProgress < 100, [currentProgress]);
  return (
    <Dialog open={open} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ paddingBottom: 3 }}>
          {text}&nbsp;{isInProgress ? <CircularProgress size="1rem" /> : ''}
        </DialogContentText>
        <LinearProgress variant="determinate" value={currentProgress} />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} disabled={isInProgress}>
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProgressDialog;
