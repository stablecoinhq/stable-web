import { useEffect, useState } from 'react';
import { useErrorHandler } from 'react-error-boundary';

const usePromiseFactory = <V>(factory: () => Promise<V | undefined>): V | undefined => {
  const [value, setValue] = useState<V | undefined>(undefined);
  const handleError = useErrorHandler();

  useEffect(() => {
    setValue(undefined);
    factory().then(setValue).catch(handleError);
  }, [factory, handleError]);

  return value;
};

export default usePromiseFactory;
