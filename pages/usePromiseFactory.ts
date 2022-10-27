import { useEffect, useState } from 'react';

const usePromiseFactory = <V>(factory: () => Promise<V | undefined>): V | undefined => {
  const [value, setValue] = useState<V | undefined>(undefined);

  useEffect(() => {
    setValue(undefined);
    factory().then(setValue);
  }, [factory]);

  return value;
};

export default usePromiseFactory;
