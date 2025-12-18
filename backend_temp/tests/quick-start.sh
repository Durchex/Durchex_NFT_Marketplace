#!/usr/bin/env bash

# 🚀 Durchex NFT Marketplace - Automated Test Suite Quick Start
# Version 1.0
# Updated: December 17, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== Configuration ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$SCRIPT_DIR"
BACKEND_DIR="$(dirname "$TESTS_DIR")"
PROJECT_DIR="$(dirname "$BACKEND_DIR")"

# ==================== Functions ====================

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ==================== Checks ====================

check_node() {
  print_info "Checking Node.js..."
  if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js v16 or higher."
    exit 1
  fi
  NODE_VERSION=$(node -v)
  print_success "Node.js $NODE_VERSION found"
}

check_mongodb() {
  print_info "Checking MongoDB..."
  if ! command -v mongod &> /dev/null && ! command -v mongosh &> /dev/null; then
    print_warning "MongoDB not found in PATH"
    print_info "MongoDB can be:"
    echo "  1. Installed locally: https://docs.mongodb.com/manual/installation/"
    echo "  2. Used via Docker: docker run -d -p 27017:27017 mongo:5"
    echo "  3. Used via MongoDB Atlas: Set DATABASE environment variable"
    return 1
  fi
  print_success "MongoDB found"
  return 0
}

check_dependencies() {
  print_info "Checking npm dependencies..."
  if [ ! -d "$TESTS_DIR/node_modules" ]; then
    print_warning "Dependencies not installed"
    print_info "Installing npm dependencies..."
    cd "$TESTS_DIR"
    npm install
    print_success "Dependencies installed"
  else
    print_success "Dependencies already installed"
  fi
}

check_env() {
  print_info "Checking environment variables..."
  
  if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_warning ".env file not found"
    print_info "Creating .env from example..."
    if [ -f "$BACKEND_DIR/.env.example" ]; then
      cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
      print_success ".env created"
    else
      print_warning "No .env.example found. Using defaults."
    fi
  else
    print_success ".env file exists"
  fi
}

# ==================== Setup ====================

setup_environment() {
  print_header "🔧 SETTING UP TEST ENVIRONMENT"
  
  check_node
  check_dependencies
  check_env
  
  # Warn about MongoDB
  if ! check_mongodb; then
    print_warning "MongoDB not found. Tests will fail without it."
    echo ""
    print_info "Start MongoDB before running tests:"
    echo "  Local:  mongod"
    echo "  Docker: docker run -d -p 27017:27017 mongo:5"
  fi
  
  echo ""
  print_success "Environment setup complete"
}

# ==================== Database ====================

setup_database() {
  print_header "🗄️  INITIALIZING TEST DATABASE"
  
  cd "$TESTS_DIR"
  
  print_info "Seeding database with test data..."
  node setup-db.js
  
  print_success "Database ready for testing"
}

# ==================== Tests ====================

run_all_tests() {
  print_header "🧪 RUNNING ALL TESTS"
  
  cd "$TESTS_DIR"
  
  print_info "Starting test suite (38 tests, ~115 seconds)..."
  echo ""
  
  node run-tests.js
  
  echo ""
  print_header "📊 TEST EXECUTION COMPLETE"
}

run_core_tests() {
  print_header "🧪 RUNNING CORE FEATURES TESTS"
  
  cd "$TESTS_DIR"
  npm run test:core
  
  print_success "Core tests complete"
}

run_giveaway_tests() {
  print_header "🧪 RUNNING GIVEAWAY & PAYMENT TESTS"
  
  cd "$TESTS_DIR"
  npm run test:giveaway
  
  print_success "Giveaway tests complete"
}

run_admin_tests() {
  print_header "🧪 RUNNING ADMIN & SECURITY TESTS"
  
  cd "$TESTS_DIR"
  npm run test:admin
  
  print_success "Admin tests complete"
}

run_smoke_tests() {
  print_header "🧪 RUNNING SMOKE TESTS (Quick)"
  
  cd "$TESTS_DIR"
  npm run test:smoke
  
  print_success "Smoke tests complete"
}

# ==================== Reports ====================

view_report() {
  print_header "📄 LATEST TEST REPORT"
  
  if [ -f "$TESTS_DIR/../reports/test-report-latest.txt" ]; then
    cat "$TESTS_DIR/../reports/test-report-latest.txt"
  else
    # Find latest report
    LATEST=$(ls -t "$TESTS_DIR/../reports"/test-report-*.txt 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
      cat "$LATEST"
    else
      print_error "No test report found. Run tests first."
    fi
  fi
}

list_reports() {
  print_header "📂 AVAILABLE TEST REPORTS"
  
  if [ -d "$TESTS_DIR/../reports" ] && [ -n "$(ls $TESTS_DIR/../reports/test-report-*.txt 2>/dev/null)" ]; then
    ls -lh "$TESTS_DIR/../reports"/test-report-*.txt
  else
    print_warning "No reports found yet"
  fi
}

# ==================== Cleanup ====================

clean_tests() {
  print_header "🧹 CLEANING TEST ARTIFACTS"
  
  print_info "Removing cached files..."
  cd "$TESTS_DIR"
  npm run clean
  
  print_success "Cleanup complete"
}

# ==================== Menu ====================

show_menu() {
  echo ""
  echo -e "${BLUE}What would you like to do?${NC}"
  echo ""
  echo "Setup & Database:"
  echo "  1) Setup environment (first time)"
  echo "  2) Initialize test database"
  echo "  3) Setup + Database (full setup)"
  echo ""
  echo "Run Tests:"
  echo "  4) Run ALL tests (38 tests, ~115 seconds)"
  echo "  5) Run CORE features tests (12 tests)"
  echo "  6) Run GIVEAWAY & payment tests (11 tests)"
  echo "  7) Run ADMIN & security tests (15 tests)"
  echo "  8) Run SMOKE tests (quick verification, ~20 seconds)"
  echo ""
  echo "Reports:"
  echo "  9) View latest test report"
  echo "  10) List all test reports"
  echo ""
  echo "Maintenance:"
  echo "  11) Clean test artifacts"
  echo "  0) Exit"
  echo ""
}

interactive_menu() {
  while true; do
    show_menu
    
    read -p "Enter your choice (0-11): " choice
    echo ""
    
    case $choice in
      1) setup_environment ;;
      2) setup_database ;;
      3) setup_environment; setup_database ;;
      4) run_all_tests ;;
      5) run_core_tests ;;
      6) run_giveaway_tests ;;
      7) run_admin_tests ;;
      8) run_smoke_tests ;;
      9) view_report ;;
      10) list_reports ;;
      11) clean_tests ;;
      0) 
        print_info "Exiting..."
        exit 0
        ;;
      *)
        print_error "Invalid choice. Please try again."
        ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
  done
}

# ==================== Command Line Arguments ====================

case "${1:-}" in
  setup)
    setup_environment
    ;;
  setup-db)
    setup_database
    ;;
  all)
    setup_environment
    setup_database
    run_all_tests
    view_report
    ;;
  core)
    run_core_tests
    ;;
  giveaway)
    run_giveaway_tests
    ;;
  admin)
    run_admin_tests
    ;;
  smoke)
    run_smoke_tests
    ;;
  report)
    view_report
    ;;
  reports)
    list_reports
    ;;
  clean)
    clean_tests
    ;;
  help)
    echo "Durchex NFT Marketplace - Test Suite Quick Start"
    echo ""
    echo "Usage: ./quick-start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup       - Setup environment and dependencies"
    echo "  setup-db    - Initialize database with test data"
    echo "  all         - Complete setup and run all tests"
    echo "  core        - Run core features tests only"
    echo "  giveaway    - Run giveaway & payment tests only"
    echo "  admin       - Run admin & security tests only"
    echo "  smoke       - Run quick smoke tests"
    echo "  report      - View latest test report"
    echo "  reports     - List all test reports"
    echo "  clean       - Clean test artifacts"
    echo "  help        - Show this help message"
    echo ""
    echo "Interactive mode (default):"
    echo "  ./quick-start.sh"
    echo ""
    ;;
  *)
    interactive_menu
    ;;
esac

