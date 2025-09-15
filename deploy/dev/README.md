# Local Development Environment

This directory contains Docker Compose configuration for local development dependencies.

## Services

- **Redis**: In-memory data store (port 6379)
- **PostgreSQL**: Primary database (port 5432)

## Usage

Start all services:
```bash
docker-compose up -d
```

Stop all services:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

## Database Connection

- **Host**: localhost
- **Port**: 5432
- **Database**: loopstacks
- **Username**: loopstacks
- **Password**: dev_password

## Redis Connection

- **Host**: localhost
- **Port**: 6379