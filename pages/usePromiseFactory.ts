import { useCallback, useEffect, useState } from 'react';
import { useErrorHandler } from 'react-error-boundary';

const usePromiseFactory = <V>(factory: () => Promise<V | undefined>): [V | undefined, () => void] => {
  const [value, setValue] = useState<V | undefined>(undefined);
  const handleError = useErrorHandler();

  const updateValue = useCallback(() => {
    setValue(undefined);
    factory().then(setValue).catch(handleError);
  }, [factory, handleError]);

  useEffect(() => {
    updateValue();
  }, [updateValue]);

  return [value, updateValue];
};

export default usePromiseFactory;
