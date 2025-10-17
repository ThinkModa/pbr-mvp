#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Dev Build Environment${NC}\n"

# Switch to dev-build branch
echo -e "${YELLOW}📂 Switching to dev-build branch...${NC}"
git checkout dev-build
git pull origin dev-build
echo -e "${GREEN}✓ On dev-build branch${NC}\n"

# Check Docker and Supabase
echo -e "${YELLOW}🐳 Checking Docker and Supabase...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

if ! supabase status > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting Supabase...${NC}"
    supabase start
fi
echo -e "${GREEN}✓ Supabase is running${NC}\n"

# Get network IP
echo -e "${YELLOW}🌐 Getting network IP...${NC}"
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
echo -e "${GREEN}✓ Network IP: ${NETWORK_IP}${NC}\n"

# Display info
echo -e "${BLUE}📱 Connection Information:${NC}"
echo -e "   Web Admin:  ${GREEN}http://localhost:3002${NC}"
echo -e "   Mobile App: ${GREEN}http://${NETWORK_IP}:8081${NC}"
echo -e "   Supabase:   ${GREEN}http://127.0.0.1:54321${NC}\n"

# Start web admin
echo -e "${YELLOW}🌐 Starting Web Admin...${NC}"
cd apps/web-admin
npm run dev > /dev/null 2>&1 &
WEB_PID=$!
echo -e "${GREEN}✓ Web Admin starting (PID: ${WEB_PID})${NC}"
echo -e "   Access at: ${GREEN}http://localhost:3002${NC}\n"
cd ../..

# Start mobile server
echo -e "${YELLOW}📱 Starting Mobile Development Server...${NC}"
cd apps/mobile
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Scan QR code or enter: http://${NETWORK_IP}:8081${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"
npx expo start --lan --clear --port 8081

# Cleanup
trap "kill $WEB_PID 2>/dev/null" EXIT
