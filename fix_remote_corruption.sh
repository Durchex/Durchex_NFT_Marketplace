#!/bin/bash
# Script to find and fix the corrupted route causing path-to-regexp error

echo "Searching for corrupted route files..."

# Find files containing the malformed route
CORRUPTED_FILES=$(grep -R "https://git.new/pathToRegexpError" /home/durchexx/htdocs/www.durchex.com/backend_temp --include="*.js" | cut -d: -f1 | sort | uniq)

if [ -z "$CORRUPTED_FILES" ]; then
    echo "No files found with the corrupted route string."
    echo "Searching for any files containing 'git.new'..."
    CORRUPTED_FILES=$(grep -R "git.new" /home/durchexx/htdocs/www.durchex.com/backend_temp --include="*.js" | cut -d: -f1 | sort | uniq)
fi

if [ -z "$CORRUPTED_FILES" ]; then
    echo "No corrupted files found. The error might be in a different location."
    exit 1
fi

echo "Found corrupted files:"
echo "$CORRUPTED_FILES"

# Fix each corrupted file
for file in $CORRUPTED_FILES; do
    echo "Fixing $file..."
    # Remove the corrupted line containing the malformed route
    sed -i '/https:\/\/git\.new\/pathToRegexpError/d' "$file"
    echo "Fixed $file"
done

echo "All corrupted files have been fixed. Try running 'node server.js' again."