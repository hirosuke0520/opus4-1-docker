#!/bin/bash

echo "Starting E2E tests for Mini CRM..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Start Docker containers if not running
echo "Starting Docker containers..."
docker compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if API is responding
echo "Checking API health..."
until curl -f http://localhost:8787/health > /dev/null 2>&1; do
  echo "Waiting for API..."
  sleep 2
done

# Check if Web is responding
echo "Checking Web health..."
until curl -f http://localhost:3000 > /dev/null 2>&1; do
  echo "Waiting for Web..."
  sleep 2
done

echo "Services are ready!"

# Make sure database is migrated and seeded
echo "Running database migrations..."
docker compose exec -T api npm run prisma:migrate || true

echo "Checking if seed data exists..."
COMPANY_COUNT=$(docker compose exec -T db mysql -uroot -ppassword minicrm -e "SELECT COUNT(*) FROM Company;" 2>/dev/null | tail -1)
if [ "$COMPANY_COUNT" -eq "0" ] 2>/dev/null; then
  echo "Seeding database..."
  docker compose exec -T api npm run prisma:seed
else
  echo "Seed data already exists, skipping..."
fi

# Run E2E tests
echo "Running E2E tests..."
cd e2e
npm install
npx playwright install chromium --with-deps
npm test

# Store exit code
EXIT_CODE=$?

echo "E2E tests completed with exit code: $EXIT_CODE"
exit $EXIT_CODE