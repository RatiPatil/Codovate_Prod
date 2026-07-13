# Contributing to Codovate

Welcome to the Codovate engineering team! This document outlines our standard operating procedures for contributing to the codebase. By following these guidelines, you help us maintain code quality, avoid merge conflicts, and ensure smooth deployments.

## Branching Strategy
We follow a structured Git branching model:
- `main`: **Production-ready code ONLY.** No one pushes directly to this branch.
- `developer`: **The core development branch.** All new features and bug fixes merge here first for testing.
- `feature/*`, `bugfix/*`: **Your personal work branches.** Created from `developer`.

### Branch Naming Conventions
Always branch off of `developer` using the following prefixes:
- `feature/` - For new features (e.g., `feature/student-dashboard`)
- `bugfix/` - For bug fixes (e.g., `bugfix/firebase-auth-error`)
- `hotfix/` - For critical production fixes (branched from `main`)
- `refactor/` - For code refactoring (e.g., `refactor/auth-context`)

*Use lowercase letters and hyphens to separate words.*

## Commit Message Rules
We use Conventional Commits to maintain a readable history and automate changelogs.

**Format:**
`<type>(<scope>): <subject>`

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Example:**
`feat(company-module): added recruiter dashboard view`
`fix(auth): resolved null pointer on token expiry`

## Pull Request (PR) Rules
1. **Target Branch:** Always target the `developer` branch (unless it's a hotfix).
2. **Title:** Use the same conventional commit format for your PR title.
3. **Description:** Clearly explain *what* you changed and *why*. Link any relevant issue/ticket numbers.
4. **Size:** Keep PRs small and focused on a single feature or fix. (Under 400 lines of code changed is ideal).
5. **Self-Review:** Review your own code before requesting a review. Check for console.logs, commented-out code, and proper formatting.

## Code Review Process
1. Once your PR is open, assign the Team Lead or a senior developer for review.
2. The reviewer will check for code quality, security, and adherence to requirements.
3. Address all comments by pushing new commits to the same branch.
4. Once approved and status checks pass, the reviewer (Team Lead) will squash and merge your PR into `developer`.

## Local Environment Setup
Do **NOT** commit your local `.env` files. 
1. Copy `.env.example` to `.env` in both the `frontend/` and `backend/` directories.
2. Ask the Team Lead for access to the **Development** Firebase keys. Do not use Production keys for local development!
