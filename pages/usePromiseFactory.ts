import { useEffect, useState } from 'react';

const usePromiseFactory = <V>(factory: () => Promise<V | undefined>) => {
  const [value, setValue] = useState<V | undefined>(undefined);

  useEffect(() => {
    factory().then(setValue);
  }, [factory]);

  return value;
};

export default usePromiseFactory;
