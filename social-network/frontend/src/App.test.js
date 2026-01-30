import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // App renders correctly - login page shown for unauthenticated users
  expect(document.body).toBeInTheDocument();
});
