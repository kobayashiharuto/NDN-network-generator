#!/bin/bash

# Check if a configuration file is provided
if [ $# -ne 1 ]; then
  echo "Usage: $0 <node number>"
  exit 1
fi

# もしNLSRの設定ファイルが存在しない場合はエラーを出力して終了
if [ ! -f "$NLSR_CONFIG_FILE_PATH" ]; then
  echo "NLSR configuration file not found. NLSR_CONFIG_FILE_PATH=$NLSR_CONFIG_FILE_PATH"
  exit 1
fi

# どこのファイルを参照するかを出力
echo "Using NLSR configuration file: $NLSR_CONFIG_FILE_PATH"

# Start nlsr with the provided configuration file and suppress output
nlsr -f "$NLSR_CONFIG_FILE_PATH" > /dev/null 2>&1 &

# Wait a moment to ensure nlsr has started
sleep 2

# Extract neighbor information and create faces
grep -A 3 "neighbor" "$NLSR_CONFIG_FILE_PATH" | while read -r line; do
  if echo "$line" | grep -q "face-uri "; then
    URI=$(echo "$line" | sed -n 's/.*face-uri \(.*\)/\1/p')
    echo "Creating face for $URI"
    nfdc face create "$URI" > /dev/null 2>&1 &
  fi
done

echo "All faces created."
