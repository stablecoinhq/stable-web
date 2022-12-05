import LanguageIcon from '@mui/icons-material/Language';
import { FormControl, MenuItem, Select } from '@mui/material';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import languages from 'languages.config';

import type { FormControlProps } from '@mui/material';
import type { SelectInputProps } from '@mui/material/Select/SelectInput';
import type { FC } from 'react';

type Language = keyof typeof languages;

const isValidLanguage = (locale: string | undefined): locale is Language => locale !== undefined && locale in languages;

const LanguagePicker: FC<{ sx?: FormControlProps['sx'] }> = ({ sx }) => {
  const router = useRouter();
  const { locale: currentLanguage, pathname, asPath, query } = router;

  const onChangeLanguage: SelectInputProps<Language>['onChange'] = useCallback(
    ({ target: { value } }: { target: { value: string } }) => {
      void router.replace({ pathname, query }, asPath, { locale: value });
    },
    [asPath, pathname, query, router],
  );

  if (!isValidLanguage(currentLanguage)) {
    return null;
  }

  return (
    <FormControl size="small" sx={sx}>
      <Select<Language>
        value={currentLanguage}
        onChange={onChangeLanguage}
        startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
        sx={{
          /* eslint-disable @typescript-eslint/naming-convention */
          '& fieldset.MuiOutlinedInput-notchedOutline': { borderWidth: '1px !important' },
          /* eslint-enable @typescript-eslint/naming-convention */
        }}
      >
        {Object.entries(languages).map(([key, name]) => (
          <MenuItem key={key} value={key}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguagePicker;
