import {
  mockServer,
  renderWithAllProviders,
  rest,
  userEvent,
  waitFor,
} from '@shieldpay/wheeljack/testing';

import { apiRoutes, BASE_URL } from '../hooks/config';

import { OnePage } from './one';

describe('one page', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('Renders initial state', async () => {
    const { findByRole } = renderWithAllProviders(<ProjectsPage />);

    expect(await findByRole('heading', { name: 'one' })).toBeInTheDocument();
  });
});
