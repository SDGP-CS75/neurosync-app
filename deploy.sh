#!/bin/bash

# NeuroSync Deployment Script
# This script helps deploy both backend and frontend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18 or higher."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_status "All requirements met!"
}

# Deploy backend
deploy_backend() {
    print_status "Starting backend deployment..."
    
    cd backend
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your production values before deploying!"
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Check for deployment platform
    echo ""
    echo "Select backend deployment platform:"
    echo "1) Railway (Recommended)"
    echo "2) Render"
    echo "3) Heroku"
    echo "4) Skip backend deployment"
    read -p "Enter choice [1-4]: " backend_choice
    
    case $backend_choice in
        1)
            print_status "Deploying to Railway..."
            if command -v railway &> /dev/null; then
                railway up
            else
                print_warning "Railway CLI not installed. Install with: npm install -g @railway/cli"
                print_status "You can also deploy via GitHub at https://railway.app"
            fi
            ;;
        2)
            print_status "Deploying to Render..."
            print_status "Please connect your GitHub repository at https://render.com"
            print_status "Set root directory to 'backend' and start command to 'npm start'"
            ;;
        3)
            print_status "Deploying to Heroku..."
            if command -v heroku &> /dev/null; then
                # Create Procfile if it doesn't exist
                if [ ! -f Procfile ]; then
                    echo "web: node src/server.js" > Procfile
                    print_status "Created Procfile"
                fi
                git add Procfile
                git commit -m "Add Procfile for Heroku deployment" || true
                heroku create neurosync-api || true
                git push heroku main
            else
                print_warning "Heroku CLI not installed. Install with: npm install -g heroku"
            fi
            ;;
        4)
            print_status "Skipping backend deployment"
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
    
    cd ..
}

# Deploy frontend
deploy_frontend() {
    print_status "Starting frontend deployment..."
    
    cd frontend
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit frontend/.env with your production values before deploying!"
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Check for deployment platform
    echo ""
    echo "Select frontend deployment platform:"
    echo "1) Mobile App (iOS/Android) via EAS"
    echo "2) Web (Vercel)"
    echo "3) Web (Netlify)"
    echo "4) Web (GitHub Pages)"
    echo "5) Skip frontend deployment"
    read -p "Enter choice [1-5]: " frontend_choice
    
    case $frontend_choice in
        1)
            print_status "Building mobile app..."
            if command -v eas &> /dev/null; then
                echo ""
                echo "Select platform:"
                echo "1) Android"
                echo "2) iOS"
                echo "3) Both"
                read -p "Enter choice [1-3]: " platform_choice
                
                case $platform_choice in
                    1)
                        eas build --platform android --profile production
                        ;;
                    2)
                        eas build --platform ios --profile production
                        ;;
                    3)
                        eas build --platform all --profile production
                        ;;
                    *)
                        print_error "Invalid choice"
                        ;;
                esac
            else
                print_warning "EAS CLI not installed. Install with: npm install -g eas-cli"
                print_status "Then run: eas login"
            fi
            ;;
        2)
            print_status "Deploying to Vercel..."
            npm run build:web
            if command -v vercel &> /dev/null; then
                vercel --prod
            else
                print_warning "Vercel CLI not installed. Install with: npm install -g vercel"
                print_status "You can also deploy via GitHub at https://vercel.com"
            fi
            ;;
        3)
            print_status "Deploying to Netlify..."
            npm run build:web
            print_status "Please connect your GitHub repository at https://netlify.com"
            print_status "Set build command to 'npm run build:web' and publish directory to 'web-build'"
            ;;
        4)
            print_status "Deploying to GitHub Pages..."
            npm run build:web
            if command -v gh-pages &> /dev/null; then
                npx gh-pages -d web-build
            else
                print_warning "gh-pages not installed. Install with: npm install --save-dev gh-pages"
            fi
            ;;
        5)
            print_status "Skipping frontend deployment"
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
    
    cd ..
}

# Main deployment flow
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           NeuroSync Deployment Script                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_requirements
    
    echo ""
    echo "What would you like to deploy?"
    echo "1) Backend only"
    echo "2) Frontend only"
    echo "3) Both backend and frontend"
    read -p "Enter choice [1-3]: " main_choice
    
    case $main_choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            deploy_backend
            deploy_frontend
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           Deployment Complete!                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    print_status "Don't forget to:"
    echo "  1. Update environment variables with production values"
    echo "  2. Update CORS_ORIGIN in backend to match your frontend URL"
    echo "  3. Update EXPO_PUBLIC_API_URL in frontend to match your backend URL"
    echo "  4. Test all features after deployment"
    echo ""
}

# Run main function
main
