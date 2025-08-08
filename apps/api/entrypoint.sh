#!/bin/sh

echo "Waiting for database to be ready..."
# Wait for database to be ready
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo "Running database migrations..."
npx prisma migrate deploy

# Check if database has been seeded (check if users exist)
echo "Checking if database needs seeding..."
USER_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | grep -c "admin@minicrm.local" || echo "0"
SELECT email FROM User WHERE email = 'admin@minicrm.local';
EOF
)

if [ "$USER_COUNT" = "0" ]; then
  echo "Running database seed..."
  npx prisma db seed
else
  echo "Database already seeded, skipping..."
fi

echo "Starting application..."
exec "$@"