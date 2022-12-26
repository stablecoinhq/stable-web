import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MetaMaskButton from 'ethereum/react/MetaMaskButton';

describe('MetaMaskButton', () => {
  describe('when MetaMask is missing', () => {
    it('shows download button', async () => {
      render(<MetaMaskButton externalProvider={null} provider={null} />);

      const link = screen.getByRole('button');
      expect(link).toHaveTextContent('connect');

      global.open = jest.fn();
      await userEvent.click(link);
      expect(global.open).toBeCalledWith(expect.stringContaining('metamask.io'), expect.anything());
    });
  });
});
