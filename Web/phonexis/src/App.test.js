import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the phonexis frontend shell', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /phonics learning/i })
  ).toBeInTheDocument();
});
