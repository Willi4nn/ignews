import { render, screen } from '@testing-library/react';
import { stripe } from '../../services/stripe';
import Home, { getStaticProps } from '../../pages';
import { mocked } from 'jest-mock';

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));
jest.mock('next-auth/client');
jest.mock('../../services/stripe');

describe('home page', () => {
  it('randers correctly', () => {
    render(<Home product={{ priceId: 'fake-price-id', amount: 'R$10,00' }} />);

    expect(screen.getByText(/R\$ 10,00/i)).toBeInTheDocument();
  });

  it('loads initial data', async () => {
    const retriveStripePricesMocked = mocked(stripe.prices.retrieve);

    retriveStripePricesMocked.mockResolvedValueOnce({
      id: 'fake-price-id',
      unit_amount: 1000,
    } as any);

    const response = await getStaticProps({});

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          product: {
            priceId: 'fake-price-id',
            amount: '$10.00',
          },
        },
      })
    );
  });
});
