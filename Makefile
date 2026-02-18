# Makefile for Docker Development & Deployment

.PHONY: help build up down logs test clean health ps scale restart

help:
	@echo "📦 E-Commerce Analytics Platform - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make build          Build Docker containers"
	@echo "  make up             Start all services"
	@echo "  make down           Stop all services"
	@echo "  make logs           View logs (follow mode)"
	@echo "  make ps             Show service status"
	@echo "  make health         Check service health"
	@echo "  make restart        Restart all services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        Run database migrations"
	@echo "  make seed           Seed database with sample data"
	@echo "  make backup         Backup database"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          Remove containers and volumes"
	@echo "  make stats          Show resource usage"
	@echo "  make test           Run tests"
	@echo "  make scale N=3      Scale backend to N instances"
	@echo ""
	@echo "Example: make up"
	@echo ""

build:
	@echo "🔨 Building Docker containers..."
	docker-compose build

up:
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo ""
	@echo "📍 Access points:"
	@echo "   Frontend: http://localhost"
	@echo "   API:      http://localhost/api"
	@echo "   Health:   http://localhost/api/health"
	@sleep 3
	@make health

down:
	@echo "🛑 Stopping services..."
	docker-compose down

up-prod:
	@echo "🚀 Starting services (PRODUCTION MODE)..."
	docker-compose -f docker-compose.yml up -d
	@echo "✅ Production services started!"

logs:
	@echo "📜 Following logs (Ctrl+C to exit)..."
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-nginx:
	docker-compose logs -f nginx

ps:
	@echo "📊 Service Status:"
	@docker-compose ps

health:
	@echo "🏥 Checking service health..."
	@echo ""
	@echo "Health Endpoint:"
	@curl -s http://localhost/health || echo "❌ Health check failed"
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost/api/health | jq . || echo "❌ API health failed"
	@echo ""
	@echo "Docker Status:"
	@docker-compose ps --no-trunc

stats:
	@echo "📈 Real-time resource usage (Ctrl+C to exit)..."
	docker stats

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete!"

restart:
	@echo "🔄 Restarting all services..."
	docker-compose restart
	@sleep 2
	@make health

migrate:
	@echo "🗂️  Running database migrations..."
	docker-compose exec -T backend npm run migrate || true

seed:
	@echo "🌱 Seeding database..."
	docker-compose exec -T backend npm run seed || true

test:
	@echo "🧪 Running tests..."
	docker-compose exec -T backend npm test

backup:
	@echo "💾 Backing up database..."
	@mkdir -p backups
	@docker-compose exec -T backend sqlite3 /app/data/analytics.db ".dump" > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "✅ Backup created in backups/ directory"

restore:
	@echo "📥 Restoring database..."
	@read -p "Enter backup file name: " file; \
	docker-compose exec -T backend sqlite3 /app/data/analytics.db < $$file
	@echo "✅ Database restored"

shell-backend:
	@echo "🐚 Opening backend shell..."
	docker-compose exec backend sh

shell-frontend:
	@echo "🐚 Opening frontend shell..."
	docker-compose exec frontend sh

shell-nginx:
	@echo "🐚 Opening nginx shell..."
	docker-compose exec nginx sh

exec:
	@read -p "Enter service name (backend/frontend/nginx): " service; \
	read -p "Enter command: " cmd; \
	docker-compose exec -T $$service $$cmd

scale:
	@if [ -z "$(N)" ]; then \
		echo "❌ Please specify N. Example: make scale N=3"; \
	else \
		echo "📈 Scaling backend to $(N) instances..."; \
		docker-compose up -d --scale backend=$(N) backend; \
		@echo "✅ Scaled to $(N) instances"; \
	fi

logs-tail:
	@read -p "Enter number of lines to show: " lines; \
	docker-compose logs --tail=$$lines

build-no-cache:
	@echo "🔨 Building Docker containers (no cache)..."
	docker-compose build --no-cache

rebuild-backend:
	@echo "🔨 Rebuilding backend..."
	docker-compose build --no-cache backend
	docker-compose up -d backend

rebuild-frontend:
	@echo "🔨 Rebuilding frontend..."
	docker-compose build --no-cache frontend
	docker-compose up -d frontend

env-check:
	@echo "✅ Checking environment configuration..."
	@if [ -f .env ]; then \
		echo "✅ .env file exists"; \
		echo ""; \
		echo "Variables set:"; \
		grep -v '^\#' .env | grep -v '^\s*$$'; \
	else \
		echo "❌ .env file not found"; \
		echo "Creating from .env.example..."; \
		cp .env.example .env; \
		echo "✅ Created .env - Please update with your values"; \
	fi

validate:
	@echo "🔍 Validating Docker Compose configuration..."
	docker-compose config > /dev/null && echo "✅ Configuration valid" || echo "❌ Configuration invalid"

version:
	@echo "Docker version:"
	@docker --version
	@echo ""
	@echo "Docker Compose version:"
	@docker-compose --version

prune:
	@echo "🧹 Pruning unused Docker resources..."
	docker system prune -f
	docker volume prune -f
	@echo "✅ Prune complete!"

info:
	@echo "📊 System Information:"
	@echo ""
	@echo "Services:"
	@docker-compose config --services
	@echo ""
	@echo "Volumes:"
	@docker-compose config --volumes
	@echo ""
	@echo "Networks:"
	@docker network ls | grep app-network

.DEFAULT_GOAL := help
