# Trilo Developer Documentation

Welcome to the Trilo developer documentation! This guide provides comprehensive information about the codebase architecture, development setup, and contribution guidelines.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Type System](#type-system)
- [Development Tools](#development-tools)
- [Testing](#testing)
- [Performance Monitoring](#performance-monitoring)
- [Coding Standards](#coding-standards)
- [Contributing](#contributing)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- React Native development environment
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Trilo

# Install dependencies
npm install

# Start the development server
npm start
```

### Development Commands

```bash
# Start development server
npm start

# Start web version
npm run start-web

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Quality check (runs all checks)
npm run quality
```

## 🏗️ Project Structure

```
Trilo/
├── app/                    # Expo Router app screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── add-expense.tsx    # Add expense screen
│   ├── add-income.tsx     # Add income screen
│   └── modal.tsx          # Modal screen
├── components/             # Reusable UI components
│   ├── layout/            # Layout components (Header, Card, Button)
│   ├── forms/             # Form components
│   ├── modals/            # Modal components
│   └── feedback/          # Feedback components (Loading, Empty states)
├── constants/              # App constants and configuration
│   ├── colors.ts          # Color definitions and theme
│   ├── categories.ts      # Transaction categories
│   └── spacing.ts         # Spacing, typography, and shadows
├── context/                # React Context providers
│   ├── FinanceContext.tsx # Main app state management
│   ├── SettingsContext.tsx # User settings and preferences
│   └── NotificationContext.tsx # Notification management
├── hooks/                  # Custom React hooks
│   ├── useStorage.ts      # AsyncStorage wrapper
│   └── useAlert.ts        # Alert management
├── services/               # Business logic services
│   ├── DataService.ts     # Data persistence and management
│   └── NotificationService.ts # Notification handling
├── types/                  # TypeScript type definitions
│   └── finance.ts         # Core financial types
├── utils/                  # Utility functions
│   ├── dateUtils.ts       # Date calculations
│   ├── payPeriodUtils.ts  # Pay period logic
│   ├── payScheduleUtils.ts # Pay schedule calculations
│   └── performance.ts     # Performance monitoring
└── __tests__/              # Unit tests
    └── utils/              # Tests for utility functions
```

## 🎯 Type System

### Core Types

The app uses a comprehensive TypeScript type system defined in `types/finance.ts`:

#### Transaction Types

```typescript
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO string
  category: CategoryType;
  type: TransactionType;
  isRecurring: boolean;
  paySchedule?: PaySchedule;
  givenExpenseSchedule?: GivenExpenseSchedule;
}
```

#### Category Types

```typescript
export type CategoryType =
  | 'income'
  | 'debt'
  | 'subscription'
  | 'bill'
  | 'savings'
  | 'one_time_expense'
  | 'given_expenses';
```

#### Pay Schedule Types

```typescript
export type PayCadence =
  | 'weekly'
  | 'every_2_weeks'
  | 'twice_monthly'
  | 'monthly'
  | 'custom';

export interface PaySchedule {
  cadence: PayCadence;
  lastPaidDate: string;
  monthlyDays?: number[];
  customDays?: number[];
}
```

### Utility Types

```typescript
// Type-safe transaction variants
export type NonRecurringTransaction = Omit<Transaction, 'isRecurring'> & {
  isRecurring: false;
};

export type RecurringTransaction = Omit<Transaction, 'isRecurring'> & {
  isRecurring: true;
};

// Form data types
export interface TransactionFormData {
  name: string;
  amount: string;
  category: CategoryType;
  isRecurring: boolean;
  paySchedule?: PaySchedule;
  givenExpenseSchedule?: GivenExpenseSchedule;
  weekDay?: WeekDay;
  weekNumber?: WeekNumber;
}
```

## 🛠️ Development Tools

### ESLint Configuration

The project uses strict ESLint rules for code quality:

- **TypeScript**: Strict type checking and best practices
- **React**: Hooks rules and component guidelines
- **React Native**: Platform-specific linting rules
- **Accessibility**: JSX accessibility guidelines
- **Code Quality**: Consistent formatting and error prevention

### Prettier Configuration

Prettier ensures consistent code formatting:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### TypeScript Configuration

- Strict mode enabled
- No implicit any types
- Strict null checks
- Path mapping for clean imports

## 🧪 Testing

### Test Structure

Tests are organized in the `__tests__/` directory mirroring the source structure:

```
__tests__/
├── utils/
│   ├── dateUtils.test.ts      # Date utility tests
│   ├── payPeriodUtils.test.ts # Pay period logic tests
│   └── performance.test.ts    # Performance monitoring tests
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Guidelines

- **Unit Tests**: Test individual functions and utilities
- **Mocking**: Mock external dependencies and React Native APIs
- **Coverage**: Aim for >80% test coverage
- **Edge Cases**: Test error conditions and boundary cases

### Example Test

```typescript
describe('dateUtils', () => {
  it('should calculate correct date for valid inputs', () => {
    const result = getDateFromWeekAndDay(2025, 7, 1, 'friday');

    expect(result.isValid).toBe(true);
    expect(result.date.getFullYear()).toBe(2025);
    expect(result.date.getMonth()).toBe(7);
  });
});
```

## 📊 Performance Monitoring

### Overview

The app includes a lightweight performance monitoring system that tracks:

- Operation timing
- Memory usage
- Performance metrics
- Slow operation detection

### Usage

```typescript
import {
  timeAsync,
  timeSync,
  logPerformanceSummary,
} from '@/utils/performance';

// Time async operations
const result = await timeAsync('database-query', async () => {
  return await fetchData();
});

// Time sync operations
const result = timeSync('calculation', () => {
  return heavyCalculation();
});

// Log performance summary
logPerformanceSummary();
```

### Features

- **Development Only**: Automatically disabled in production builds
- **Automatic Timing**: Wraps operations without code changes
- **Memory Tracking**: Monitors heap usage when available
- **Slow Operation Detection**: Warns about operations >100ms
- **Export Capability**: JSON export for analysis

## 📝 Coding Standards

### General Principles

1. **Type Safety**: Use TypeScript strictly, avoid `any` types
2. **Consistency**: Follow established patterns and conventions
3. **Error Handling**: Graceful degradation and user feedback
4. **Performance**: Optimize for mobile performance
5. **Accessibility**: Follow React Native accessibility guidelines

### Naming Conventions

```typescript
// Components: PascalCase
export default function TransactionItem() {}

// Functions: camelCase
export function calculatePayPeriods() {}

// Constants: UPPER_SNAKE_CASE or PascalCase
export const MAX_RETRY_ATTEMPTS = 3;
export const Spacing = { ... };

// Types/Interfaces: PascalCase
export interface TransactionFormData {}
export type CategoryType = 'income' | 'expense';
```

### File Organization

- **One Component Per File**: Keep components focused and single-purpose
- **Feature-Based Grouping**: Group related functionality together
- **Consistent Imports**: Use relative imports with `@/` alias
- **Export Patterns**: Use named exports for utilities, default for components

### Code Style

```typescript
// Prefer const over let
const transactions = getTransactions();

// Use early returns for guard clauses
if (!isValid) {
  return null;
}

// Destructure props and state
const { name, amount, category } = transaction;

// Use optional chaining and nullish coalescing
const displayName = user?.profile?.name ?? 'Anonymous';
```

## 🤝 Contributing

### Development Workflow

1. **Fork and Clone**: Create your fork and clone locally
2. **Feature Branch**: Create a feature branch from `main`
3. **Development**: Implement your feature with tests
4. **Quality Checks**: Run all quality checks locally
5. **Commit**: Use conventional commit messages
6. **Push and PR**: Push your branch and create a pull request

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Examples:

```
feat(transactions): add recurring expense support
fix(calendar): resolve date alignment issues
docs(readme): update installation instructions
```

### Pull Request Guidelines

- **Description**: Clear description of changes and rationale
- **Testing**: Include tests for new functionality
- **Documentation**: Update docs for new features
- **Screenshots**: Include UI changes if applicable
- **Breaking Changes**: Document any breaking changes

### Code Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one approval required
3. **Testing**: Verify functionality works as expected
4. **Documentation**: Ensure docs are updated
5. **Merge**: Squash and merge to main branch

## 🔧 Troubleshooting

### Common Issues

#### TypeScript Errors

```bash
# Check for type errors
npm run type-check

# Fix import issues
npm run lint:fix
```

#### Linting Issues

```bash
# Check linting issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

#### Test Failures

```bash
# Run tests with verbose output
npm run test -- --verbose

# Check test coverage
npm run test:coverage
```

#### Performance Issues

```typescript
// Enable performance monitoring in development
import { logPerformanceSummary } from '@/utils/performance';

// Log performance metrics
logPerformanceSummary();
```

### Getting Help

- **Issues**: Check existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Review this guide and code comments
- **Code Examples**: Look at existing implementations

## 📚 Additional Resources

### React Native Documentation

- [React Native Official Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

### TypeScript Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Testing Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

### Performance Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Flipper for Debugging](https://fbflipper.com/)

---

**Happy coding! 🚀**

For questions or contributions, please refer to the project's GitHub repository.
