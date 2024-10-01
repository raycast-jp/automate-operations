#!/bin/bash

# Validate the word count of the post
# Usage: ./validate_word_count.sh <file>

FILE=$1

if [ ! -f "$FILE" ]; then
  echo "File not found!"
  exit 1
fi

WORD_COUNT=$(wc -m < "$FILE")

if [ "$WORD_COUNT" -gt 200 ]; then
  echo "Word count exceeds 200 characters!"
  exit 1
fi

echo "Word count is within the limit."
exit 0
