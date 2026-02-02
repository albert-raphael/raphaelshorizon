#!/bin/bash
# fix-filenames.sh

# Fix audiobook filenames
cd audiobooks
for file in *; do
    # Remove special characters, replace spaces with underscores
    newname=$(echo "$file" | tr ' ' '_' | tr -d '()[]{}!@#$%^&*')
    mv "$file" "$newname"
done

# Fix book filenames (for Calibre)
cd ../books
for file in *; do
    # Remove special characters, replace spaces with underscores
    newname=$(echo "$file" | tr ' ' '_' | tr -d '()[]{}!@#$%^&*')
    mv "$file" "$newname"
done