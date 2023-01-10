import type { FC, ReactNode } from 'react';

const HelperText: FC<{ children: ReactNode }> = ({ children }) => <span style={{ fontSize: 14 }}>{children}</span>;

export default HelperText;
