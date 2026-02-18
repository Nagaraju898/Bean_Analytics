# Docker Helper Scripts

This directory contains optional helper scripts for Docker operations.

## Available Scripts

- `health-check.sh` - Monitor service health
- `backup-data.sh` - Backup database and configuration
- `restore-data.sh` - Restore from backup
- `clean-volumes.sh` - Remove unused Docker data

Each script includes documentation and usage examples.

## Usage

```bash
chmod +x .docker/*.sh
./.docker/health-check.sh
```

## Docker-Compose Configuration Files

- **docker-compose.yml** - Production configuration
- **docker-compose.override.yml** - Development overrides (auto-loaded)
  - Mounts source code for live reload
  - Exposes ports for debugging
  - Uses development environment variables
  - Enables stdin/tty for interactive development

## Development vs Production

When you run `docker-compose up`, Docker Compose automatically loads both:
1. `docker-compose.yml` (base configuration)
2. `docker-compose.override.yml` (development overrides)

Settings in `override.yml` take precedence over `base.yml`.

### To run in production mode, explicitly use:

```bash
docker-compose -f docker-compose.yml up -d
```

### To run in development mode:

```bash
docker-compose up
# or explicitly
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

## Tips for Development

1. **Hot Reload**
   - Backend: Nodemon watches for changes (automatic restart)
   - Frontend: React scripts enable auto-refresh (use live reload)

2. **Debugging**
   - Logs: `docker-compose logs -f backend`
   - Exec: `docker-compose exec backend node -e "console.log(process.env)"`
   - Attach debugger to Node.js process

3. **Database**
   - SQLite file accessible in `server/data/`
   - View with: `sqlite3 server/data/analytics.db`
   - Backup: `docker-compose exec backend cp /app/data/analytics.db ./backup.db`

4. **Environment**
   - Copy `.env.example` to `.env`
   - Update values specific to development
   - Development defaults provided in `docker-compose.override.yml`
