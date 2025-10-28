# ErrorBoundary Component

## Overview

The `ErrorBoundary` component is a React error boundary that catches JavaScript errors anywhere in the child component tree, logs those errors, and displays a fallback UI instead of the crashed component tree.

## Features

- **Silent Crash Prevention**: Prevents the app from crashing silently on startup
- **Context-Aware Error Handling**: Identifies which part of the app failed
- **Retry Mechanism**: Allows users to attempt to reload the failed component
- **Enhanced Logging**: Provides detailed error information in Metro console
- **Custom Fallback Support**: Accepts custom fallback UI components
- **Error Counting**: Tracks how many times errors have occurred

## Usage

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### With Context

```tsx
<ErrorBoundary context="User Profile">
  <UserProfileComponent />
</ErrorBoundary>
```

### With Custom Fallback

```tsx
const CustomFallback = () => (
  <View>
    <Text>Something went wrong in the user profile</Text>
    <Button title="Go Back" onPress={handleGoBack} />
  </View>
);

<ErrorBoundary 
  context="User Profile"
  fallback={<CustomFallback />}
>
  <UserProfileComponent />
</ErrorBoundary>
```

## Implementation in App

The ErrorBoundary is implemented at multiple levels in the app:

1. **App Root**: Catches any top-level errors
2. **Settings Provider**: Catches theme/settings-related errors
3. **Finance Provider**: Catches financial data errors
4. **Savings Provider**: Catches savings goal errors
5. **Notification Provider**: Catches notification-related errors

## Error Handling Flow

1. **Error Occurs**: A component throws an error during render
2. **Error Caught**: ErrorBoundary catches the error via `componentDidCatch`
3. **Error Logged**: Error details are logged to console with context
4. **Fallback Rendered**: Fallback UI is displayed instead of crashed component
5. **User Options**: User can retry or report the error

## Console Output

When an error occurs, the following information is logged:

```
[Context] ErrorBoundary caught an error: {
  message: "Error message",
  name: "Error name",
  stack: "Error stack trace",
  componentStack: "React component stack",
  timestamp: "2024-01-01T00:00:00.000Z",
  errorCount: 1
}

[Context] Error Details
Error: Error object
Error Stack: Stack trace
Component Stack: Component hierarchy
Error Count: Number of errors
```

## Fallback UI

The default fallback UI includes:

- **Error Title**: "App failed to load"
- **Context Information**: Which part of the app failed
- **Retry Button**: Attempts to reload the component
- **Report Button**: Logs additional debugging information
- **Error Count**: Shows how many times errors have occurred
- **Debug Info**: Additional error details in development mode

## Best Practices

1. **Wrap Critical Providers**: Always wrap context providers in ErrorBoundaries
2. **Use Context Labels**: Provide meaningful context labels for easier debugging
3. **Custom Fallbacks**: Use custom fallbacks for better user experience
4. **Error Reporting**: Implement proper error reporting in production
5. **Graceful Degradation**: Design fallbacks that allow users to continue using the app

## Example Scenarios

### Provider Initialization Error

```tsx
// If FinanceProvider fails to initialize
<ErrorBoundary context="Finance Provider">
  <FinanceProvider>
    {/* Finance-related components */}
  </FinanceProvider>
</ErrorBoundary>
```

### Component Render Error

```tsx
// If a specific component fails to render
<ErrorBoundary context="Transaction List">
  <TransactionList transactions={transactions} />
</ErrorBoundary>
```

### Async Operation Error

```tsx
// If async operations fail
<ErrorBoundary context="Data Loading">
  <AsyncDataComponent />
</ErrorBoundary>
```

## Troubleshooting

### ErrorBoundary Not Catching Errors

- Ensure the error occurs during render (not in event handlers)
- Check that the ErrorBoundary is properly wrapping the failing component
- Verify the error is a JavaScript error (not a Promise rejection)

### Fallback UI Not Showing

- Check console for error logs
- Verify the error is being thrown during render
- Ensure the ErrorBoundary is not being unmounted

### Performance Issues

- Avoid wrapping too many components in ErrorBoundaries
- Use context labels to identify specific failure points
- Consider lazy loading for heavy components

## Development vs Production

- **Development**: Shows detailed error information and debug UI
- **Production**: Shows minimal error information for security
- **Error Logging**: Always logs errors regardless of environment
- **Fallback UI**: Consistent across environments
