#!/bin/bash

# Database setup script for PBR MVP
# This script helps set up the database for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up PBR MVP Database${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: export DATABASE_URL='postgresql://user:password@localhost:5432/pbr_mvp'"
    exit 1
fi

echo -e "${YELLOW}📋 Database URL: ${DATABASE_URL}${NC}"

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}📄 Running: ${description}${NC}"
    
    if [ -f "$file" ]; then
        psql "$DATABASE_URL" -f "$file"
        echo -e "${GREEN}✅ ${description} completed${NC}"
    else
        echo -e "${RED}❌ File not found: ${file}${NC}"
        exit 1
    fi
}

# Run migrations in order
echo -e "${YELLOW}🔄 Running database migrations...${NC}"

run_sql_file "migrations/001_initial_schema.sql" "Initial schema creation"
run_sql_file "migrations/002_add_rls_policies.sql" "Row Level Security policies"

# Ask if user wants to seed development data
read -p "Do you want to seed development data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_sql_file "migrations/003_seed_dev_data.sql" "Development data seeding"
fi

echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Update your .env files with the correct DATABASE_URL"
echo "2. Test the connection with: npm run db:test"
echo "3. Generate types with: npm run db:generate-types"
