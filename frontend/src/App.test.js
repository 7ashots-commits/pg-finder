import { render, screen } from '@testing-library/react';
import App from './App';

test('renders PG Finder login page', () => {
  render(<App />);
  const loginText = screen.getByText(/PG Finder - Login/i);
  expect(loginText).toBeInTheDocument();
});
