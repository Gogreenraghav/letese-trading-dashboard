#!/bin/bash

# Website Questionnaire Bot - Deployment Script
# Run: bash deploy.sh

echo "==========================================="
echo "🚀 Website Questionnaire Bot - Deployment"
echo "==========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"

echo ""
echo "📁 Files in current directory:"
ls -la

echo ""
echo "🔧 Installation Options:"
echo "1. Local testing"
echo "2. Deploy to Vercel"
echo "3. Deploy to Netlify"
echo "4. Deploy to GitHub Pages"
echo "5. Custom deployment"
echo ""

read -p "Select option (1-5): " option

case $option in
    1)
        echo ""
        echo "🚀 Starting local server..."
        echo "The bot will be available at: http://localhost:3000"
        echo "Press Ctrl+C to stop the server"
        echo ""
        
        # Install serve if not installed
        if ! command -v serve &> /dev/null; then
            echo "Installing serve..."
            npm install -g serve
        fi
        
        # Start server
        serve .
        ;;
    
    2)
        echo ""
        echo "🚀 Deploying to Vercel..."
        echo ""
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        # Deploy to Vercel
        vercel --prod
        ;;
    
    3)
        echo ""
        echo "🚀 Deploying to Netlify..."
        echo ""
        
        # Check if Netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            echo "Installing Netlify CLI..."
            npm install -g netlify-cli
        fi
        
        # Deploy to Netlify
        netlify deploy --prod
        ;;
    
    4)
        echo ""
        echo "🚀 Deploying to GitHub Pages..."
        echo ""
        
        # Check if git is installed
        if ! command -v git &> /dev/null; then
            echo "❌ Git is not installed"
            echo "Please install Git from: https://git-scm.com/"
            exit 1
        fi
        
        # Initialize git if not already
        if [ ! -d ".git" ]; then
            git init
            git add .
            git commit -m "Initial commit: Website Questionnaire Bot"
        fi
        
        # Install gh-pages
        echo "Installing gh-pages..."
        npm install --save-dev gh-pages
        
        # Update package.json for GitHub Pages
        echo '{
  "homepage": "https://[username].github.io/[repository]",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d ."
  }
}' > package.json.update
        cat package.json.update >> package.json
        rm package.json.update
        
        # Deploy
        npm run deploy
        
        echo ""
        echo "✅ Deployed to GitHub Pages!"
        echo "Your bot is live at: https://[username].github.io/[repository]"
        ;;
    
    5)
        echo ""
        echo "📋 Custom Deployment Instructions:"
        echo ""
        echo "1. Upload all files to your hosting provider"
        echo "2. Ensure index.html is in the root directory"
        echo "3. Configure your domain (if needed)"
        echo "4. Test the bot at your domain"
        echo ""
        echo "Required files:"
        echo "  - index.html (main file)"
        echo "  - package.json (optional)"
        echo "  - README.md (optional)"
        echo ""
        echo "The bot uses CDN links, so no additional files needed."
        ;;
    
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "==========================================="
echo "✅ Deployment process completed!"
echo "==========================================="
echo ""
echo "📞 Need help?"
echo "1. Check README.md for documentation"
echo "2. Test the bot locally first"
echo "3. Contact support if needed"
echo ""
echo "🎉 Your bot is ready to use!"