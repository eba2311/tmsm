#!/bin/sh
set -e

echo "🚀 TMSM Starting..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Load environment variables from .env if it exists
if [ -f ./server/.env ]; then
  echo "📄 Loading environment from ./server/.env"
  export $(cat ./server/.env | grep -v '^#' | xargs)
fi

# Run the server with proper output
exec node server/src/index.js
