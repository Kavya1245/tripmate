import { formatCurrency } from './utils';

test('formats currency correctly', () => {
  expect(formatCurrency(1000)).toBe('$1,000.00');
  expect(formatCurrency(0)).toBe('$0.00');
});
