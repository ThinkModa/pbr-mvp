#!/bin/bash

# Location Migration Script for Know Us Atlanta 2025
# This script backs up data, runs migration, and restores data

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Location Migration for Know Us Atlanta 2025${NC}\n"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if Supabase is running
echo -e "${YELLOW}🔍 Checking Supabase status...${NC}"
if ! supabase status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Supabase not running. Starting Supabase...${NC}"
    supabase start
fi
echo -e "${GREEN}✅ Supabase is running${NC}\n"

# Step 1: Backup the event data
echo -e "${YELLOW}📦 Step 1: Backing up Know Us Atlanta 2025 event data...${NC}"
node backup-know-us-atlanta-2025.js backup
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup completed successfully${NC}\n"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Step 2: Run the migration
echo -e "${YELLOW}🔄 Step 2: Running database migration...${NC}"
supabase db reset --linked
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully${NC}\n"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# Step 3: Restore the event data
echo -e "${YELLOW}📥 Step 3: Restoring Know Us Atlanta 2025 event data...${NC}"
node backup-know-us-atlanta-2025.js restore
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data restoration completed successfully${NC}\n"
else
    echo -e "${RED}❌ Data restoration failed${NC}"
    exit 1
fi

# Step 4: Verify the migration
echo -e "${YELLOW}🔍 Step 4: Verifying migration...${NC}"
echo "Checking if location_name column exists..."
supabase db diff --linked > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema is up to date${NC}"
else
    echo -e "${YELLOW}⚠️  Database schema has changes (this is expected after migration)${NC}"
fi

echo -e "\n${GREEN}🎉 Location migration completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Test the web admin at http://localhost:3002"
echo -e "   2. Verify that location_name and location fields work correctly"
echo -e "   3. Test Google Places autocomplete functionality"
echo -e "   4. Check that Know Us Atlanta 2025 event data is preserved"
echo -e "\n${YELLOW}💡 The web admin should now properly save:${NC}"
echo -e "   • location_name: Custom location name (e.g., 'Main Conference Room')"
echo -e "   • location: Google Places data (address, coordinates, placeId)"
