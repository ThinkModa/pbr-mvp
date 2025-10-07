#!/bin/bash

# Database reset script for PBR MVP
# WARNING: This will drop all tables and data!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  WARNING: This will DROP ALL TABLES and DATA!${NC}"
echo -e "${YELLOW}This action cannot be undone.${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

# Confirm the action
read -p "Are you sure you want to reset the database? Type 'RESET' to confirm: " -r
if [[ $REPLY != "RESET" ]]; then
    echo -e "${YELLOW}❌ Database reset cancelled${NC}"
    exit 0
fi

echo -e "${YELLOW}🔄 Resetting database...${NC}"

# Drop all tables (in reverse order to handle foreign keys)
psql "$DATABASE_URL" -c "
DROP TABLE IF EXISTS media_objects CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS chat_memberships CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_threads CASCADE;
DROP TABLE IF EXISTS activity_rsvps CASCADE;
DROP TABLE IF EXISTS event_rsvps CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS organization_memberships CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS processing_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS chat_thread_type CASCADE;
DROP TYPE IF EXISTS rsvp_status CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
"

echo -e "${GREEN}✅ Database reset completed${NC}"
echo -e "${YELLOW}💡 Run ./scripts/setup.sh to recreate the database${NC}"
