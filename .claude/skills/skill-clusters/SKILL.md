```markdown
# skill-clusters Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches best practices and conventions for developing Python projects in the `skill-clusters` repository. It covers code style, file organization, commit patterns, and testing approaches. The repository uses conventional commits, PascalCase file naming, relative imports, and named exports, providing a clean and maintainable codebase structure.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example: `SkillCluster.py`, `DataProcessor.py`

### Import Style
- **Relative imports** are preferred within the project.
  - Example:
    ```python
    from .SkillCluster import SkillCluster
    ```

### Export Style
- **Named exports** are used, making explicit what is available for import.
  - Example:
    ```python
    __all__ = ["SkillCluster", "DataProcessor"]
    ```

### Commit Messages
- **Conventional commit** format is used, with the `feat` prefix for features.
  - Example:
    ```
    feat: add SkillCluster grouping logic
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature or module  
**Command:** `/feature-development`

1. Create a new file using PascalCase (e.g., `NewFeature.py`).
2. Implement the feature using relative imports as needed.
3. Export new classes or functions using named exports.
4. Write or update corresponding test files (`NewFeature.test.py`).
5. Commit changes using the conventional commit format:
   ```
   feat: short description of the feature
   ```

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Identify test files matching the `*.test.*` pattern.
2. Run tests using your preferred Python test runner (e.g., `pytest` or `unittest`).
3. Review test results and address any failures.

## Testing Patterns

- Test files follow the `*.test.*` naming pattern (e.g., `SkillCluster.test.py`).
- The specific testing framework is not enforced, but standard Python testing tools are compatible.
- Tests are placed alongside or near the modules they cover.

**Example test file:**
```python
# SkillCluster.test.py
import unittest
from .SkillCluster import SkillCluster

class TestSkillCluster(unittest.TestCase):
    def test_grouping(self):
        cluster = SkillCluster()
        self.assertTrue(cluster.group(['a', 'b']))
```

## Commands
| Command              | Purpose                                      |
|----------------------|----------------------------------------------|
| /feature-development | Start a new feature using project conventions|
| /run-tests           | Run all test files matching `*.test.*`       |
```
