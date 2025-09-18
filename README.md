# Journalist Directory API

A RESTful API for accessing a directory of journalists and the publications they write for.
Built with NestJS
as the server framework and powered by PostgreSQL
with Prisma
as the ORM for database persistence.

## Features

- 🔍 Search journalists by name, publication, region or other relevant information.
- 📰 Access details of journalists and their associated publications.
- ➕ Add, update, and delete journalist records (admin endpoints).
- ⚡ Built with NestJS for a modular, scalable structure.
- 💾 PostgreSQL + Prisma for reliable and type-safe persistence.
- 🛠️ Environment-based configuration and migration support.

## Tech Stack

- Backend Framework: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Package Manager: yarn
- Runtime: Node.js (v22+)

## Getting Started

### Prerequisites

- Node.js v22 or higher
- PostgreSQL running locally or remotely or in docker containers
- yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/mediamine/web-api.git
cd web-api
```

2. Install dependencies:

```bash
$ yarn
```

3. Copy the example environment file and configure:

```bash
cp .env.example .env
```

Update values in the .env file eg. for database connection URL:

```ini
DATABASE_URL="postgresql://mediamine:mediamine@localhost:5432/mediamine?schema=public"
```

## Run the app

1. Locally

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Build Docker image

```
docker build -t mediamine/web-api .
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## API Endpoints

After starting the server. open http://localhost:3002/api for the API Endpoint definitions.

## Database Schema

Refer to the `prisma` folder for the schema definitions.

## License

This project is licensed under the [MIT licensed](LICENSE).
