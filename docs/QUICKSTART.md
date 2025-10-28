# Trilo Quick Start Guide

Get up and running with Trilo development in minutes!

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development

```bash
npm start
```

### 3. Run Quality Checks

```bash
npm run quality
```

## 🧪 Testing Your Setup

### Run Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Check Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format:check
```

## 🚀 Development Workflow

### 1. Make Changes

Edit files in your preferred editor

### 2. Check Quality

```bash
npm run quality
```

### 3. Fix Issues

```bash
# Auto-fix linting issues
npm run lint:fix

# Auto-format code
npm run format
```

### 4. Test Changes

```bash
npm run test
```

## 📱 Running the App

### iOS Simulator

```bash
npm start
# Press 'i' in terminal
```

### Android Emulator

```bash
npm start
# Press 'a' in terminal
```

### Web Version

```bash
npm run start-web
```

## 🔧 Common Commands

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm start`          | Start development server |
| `npm run test`       | Run all tests            |
| `npm run lint`       | Check code quality       |
| `npm run lint:fix`   | Auto-fix linting issues  |
| `npm run format`     | Format all code          |
| `npm run type-check` | Check TypeScript types   |
| `npm run quality`    | Run all quality checks   |

## 🐛 Troubleshooting

### TypeScript Errors

```bash
npm run type-check
```

### Linting Issues

```bash
npm run lint:fix
```

### Test Failures

```bash
npm run test -- --verbose
```

### Performance Issues

```typescript
import { logPerformanceSummary } from '@/utils/performance';
logPerformanceSummary();
```

## 📚 Next Steps

- Read the [full documentation](README.md)
- Check out the [coding standards](README.md#coding-standards)
- Review the [contribution guidelines](README.md#contributing)

---

**Need help?** Check the main documentation or create an issue!
