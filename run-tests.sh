#!/bin/bash
# filepath: /Users/taea/dev/quiet/run-tests.sh

# Failed tests
# channel.menu.test.tsx
# channel.add.test.tsx
# community.create.test.tsx
# community.join.test.tsx

# Directory containing the test files
TEST_DIR="./packages/desktop/src"

# Find all files matching the pattern *.test.tsx in the directory
find "$TEST_DIR" -type f -name "*.test.tsx" | while read -r file; do
  echo "Running tests for $file"
  filename=$(basename -- "$file")
  # filename="${filename%.*}"
  npx lerna run test --scope=@quiet/desktop -- "$filename"
done
