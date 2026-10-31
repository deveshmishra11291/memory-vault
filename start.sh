#!/bin/bash
cd "$(dirname "$0")"
export PATH="$HOME/.bun/bin:$PATH"

echo "=========================================="
echo " Starting MemoryVault 1999 (Private Vault)"
echo " Local URL: http://localhost:3000"
echo "=========================================="

# Automatically open the browser tab after 1 second
(sleep 1.2 && open "http://localhost:3000") &

# Start production server
bun run start -p 3000
