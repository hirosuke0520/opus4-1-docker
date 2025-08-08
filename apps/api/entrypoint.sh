#!/bin/sh

echo "Waiting for database to be ready..."
# Wait for database to be ready
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo "Running database migrations..."
npx prisma migrate deploy

echo "Running database seed..."
npx prisma db seed

echo "Starting application..."
exec "$@"