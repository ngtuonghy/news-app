# News App
Instructions to run the project using Docker Compose and start the Astro app.
## Requirements
- Docker
- Docker Compose
- Node.js (for Astro)

## 1. Clone the project
```bash
git clone https://github.com/ngtuonghy/news-app.git
cd news-app
````

## 2. Run Docker Compose

Docker Compose will build and start all services (app, database, redis, etc.).

```bash
docker-compose up --build
```

To run in the background:

```bash
docker-compose up -d --build
```

## 3. Run Astro

Inside the app container, go to the Astro project folder (if not already there):

```bash
cd /app
```

Install dependencies 
```bash
npm install
npm run dev
```

Init seed data:
```bash
npm run seed
# or npm run seed:reset to reset data
```

Start the dev server:
```bash
npm run dev
```

Astro will be available at: [http://localhost:4321](http://localhost:4321)

## 4. Stop Docker Compose

```bash
docker-compose down
```



