# Contributing to OKR Builder

Thank you for your interest in contributing to OKR Builder! We welcome contributions from the community. This document provides guidelines and information for contributors.

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## How to Contribute

### 1. Fork the Repository

Fork the repository on GitHub and clone your fork locally:

```bash
git clone https://github.com/yourusername/okr-builder.git
cd okr-builder
```

### 2. Set Up Development Environment

Follow the setup instructions in the [README.md](README.md) to get the development environment running.

### 3. Create a Feature Branch

Create a feature branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 4. Make Your Changes

- Write clear, concise commit messages
- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure your code passes all tests

### 5. Test Your Changes

Run the test suite to ensure your changes don't break existing functionality:

```bash
npm test
npm run build  # Ensure the build passes
```

### 6. Submit a Pull Request

1. Push your changes to your fork
2. Create a Pull Request from your feature branch to the main branch
3. Fill out the Pull Request template with:
   - Clear description of changes
   - Reference to any related issues
   - Screenshots for UI changes
   - Testing instructions

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint and Prettier configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused on a single responsibility

### Component Guidelines

- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow the established component structure
- Use the provided UI components from shadcn/ui
- Ensure accessibility (ARIA labels, keyboard navigation)

### Database Changes

- Use Prisma migrations for schema changes
- Update seed data if needed
- Ensure backward compatibility
- Test migrations thoroughly

### Testing

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Aim for good test coverage
- Test edge cases and error conditions

### Documentation

- Update README.md for significant changes
- Add JSDoc comments for new functions
- Update API documentation for endpoint changes
- Include examples in documentation

## Commit Message Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add Google OAuth integration

fix(dashboard): resolve progress calculation bug

docs(api): update endpoint documentation
```

## Pull Request Process

1. **Title**: Clear, descriptive title following conventional commit format
2. **Description**: Detailed explanation of changes
3. **Testing**: How to test the changes
4. **Screenshots**: For UI changes
5. **Breaking Changes**: Clearly marked if any
6. **Related Issues**: Reference issues this PR addresses

### Review Process

- At least one maintainer must review and approve
- All CI checks must pass
- Tests must pass
- Code follows project standards
- Documentation is updated

## Issue Reporting

When reporting bugs or requesting features:

- Use the appropriate issue template
- Provide detailed steps to reproduce
- Include environment information
- Add screenshots for UI issues
- Check for existing similar issues

## Getting Help

- Check the [README.md](README.md) for setup and usage instructions
- Search existing issues and discussions
- Create a new discussion for questions
- Join our community chats (if available)

## Recognition

Contributors will be recognized in:
- Release notes
- Contributors file
- Project acknowledgments

Thank you for contributing to OKR Builder! 🎉
