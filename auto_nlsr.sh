#!/bin/bash

# Check if a configuration file is provided
if [ $# -ne 1 ]; then
  echo "Usage: $0 <node number>"
  exit 1
fi

CONFIG_FILE=nlsr-"$1".conf

# Start nlsr with the provided configuration file and suppress output
nlsr -f "$CONFIG_FILE" > /dev/null 2>&1 &

# Wait a moment to ensure nlsr has started
sleep 2

# Extract neighbor information and create faces
grep -A 3 "neighbor" "$CONFIG_FILE" | while read -r line; do
  if echo "$line" | grep -q "face-uri "; then
    URI=$(echo "$line" | sed -n 's/.*face-uri \(.*\)/\1/p')
    echo "Creating face for $URI"
    nfdc face create "$URI" > /dev/null 2>&1 &
  fi
done

echo "All faces created."
