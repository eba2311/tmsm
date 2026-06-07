#!/bin/sh
set -e

echo "🚀 TMSM Starting..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Run the server with proper output
exec node server/src/index.js
