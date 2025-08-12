# Contributing to Victim Reporting Portal (SafeVoice)

Thank you for your interest in contributing to the Victim Reporting Portal! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

We welcome contributions from the community! Here are several ways you can help:

### 🐛 Report Bugs
- Use the GitHub issue tracker
- Provide detailed information about the bug
- Include steps to reproduce
- Mention your operating system and browser

### 💡 Suggest Features
- Open a feature request issue
- Describe the feature and its benefits
- Consider implementation complexity

### 🔧 Fix Bugs
- Look for issues labeled "good first issue" or "help wanted"
- Comment on the issue to let others know you're working on it
- Follow the coding standards below

### 📚 Improve Documentation
- Fix typos and clarify unclear sections
- Add examples and use cases
- Improve code comments

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git
- Basic knowledge of React and Node.js

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Portal.git
   cd Portal
   ```

2. **Add the original repository as upstream**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/Portal.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Coding Standards

### JavaScript/Node.js
- Use ES6+ features when possible
- Follow the existing code style and indentation
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Handle errors appropriately

### React
- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable
- Use proper prop types or TypeScript

### General
- Write clear, descriptive commit messages
- Keep functions small and focused
- Add appropriate error handling
- Include tests for new features

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Running All Tests
```bash
npm test
```

## 📤 Submitting Changes

1. **Ensure your code works**
   - Run all tests
   - Test manually if applicable
   - Check for linting errors

2. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select the feature branch
   - Write a clear description of your changes

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows the project's style guidelines
- [ ] All tests pass
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] No console.log statements left in code

### Pull Request Template
```markdown
## Description
Brief description of what this PR accomplishes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No breaking changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have made corresponding changes to documentation
```

## 🏷️ Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add user authentication system"
git commit -m "fix: resolve database connection issue"
git commit -m "docs: update API documentation"
```

## 🐛 Issue Reporting

When reporting issues, please include:

- **Title**: Clear, descriptive title
- **Description**: Detailed description of the problem
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: OS, browser, Node.js version
- **Screenshots**: If applicable

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check the `/docs` folder first

## 🎯 Project Goals

Our mission is to create a secure, accessible platform for incident reporting that:
- Protects user privacy and confidentiality
- Provides intuitive user experience
- Maintains high security standards
- Supports multiple incident types
- Integrates AI for better analysis

## 🙏 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame

Thank you for contributing to making communities safer! 🚨❤️ 