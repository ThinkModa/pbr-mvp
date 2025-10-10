#!/bin/bash

echo "🔑 Generating EAS Credentials for Development Build"
echo "=================================================="

echo "📱 Generating Android credentials..."
echo "y" | npx eas credentials --platform android --profile development

echo ""
echo "🍎 Generating iOS credentials..."
echo "y" | npx eas credentials --platform ios --profile development

echo ""
echo "✅ Credentials generated! Now building development client..."

echo "📱 Building Android development client..."
npx eas build --profile development --platform android --non-interactive

echo ""
echo "🍎 Building iOS development client..."
npx eas build --profile development --platform ios --non-interactive

echo ""
echo "🎉 Development builds complete!"
echo "Check your EAS dashboard for download links:"
echo "https://expo.dev/accounts/helprs_dev/projects/pbr-mvp"
