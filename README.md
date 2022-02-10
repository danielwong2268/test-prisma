# Setup

- `npm install`
- Start Postgres database `docker-compose up -d`
- `npx prisma migrate dev`
- `npm run dev`

# Background

This test will upsert a test user, then spin up several transactions that increment the user's ID.

There is a `CONCURRENCY` variable, which determines the number of transactions to run in parallel

There is a `WITH_LOCK` variable, which sets up row level locking so the ID sequentially

There is a `ADD_DELAY` variable, which adds a wait of 100ms between the fetch and the update.

# Expected results

Running with CONCURRENCY=10 and WITH_LOCK=true and ADD_DELAY=true should work, and the final id should be 1 + 10 = 11.

# Current behavior

Running with CONCURRENCY > 2 and WITH_LOCK=true and ADD_DELAY=true consistently causes prisma to hang on my machine.

Running with CONCURRENCY > 4 and WITH_LOCK=true and ADD_DELAY=false consistently causes prisma to hang on my machine. So without the delay, it appears to perform better without the delay?

Running with CONCURRENCY = 10 and WITH_LOCK=false and ADD_DELAY=true works perfectly fine. The test is able to complete. Obviously the outcome is incorrect, since the final user id counter is equal to 2 since we are not locking.

Running with CONCURRENCY = 10 and WITH_LOCK=false and ADD_DELAY=false causes the test to hang. Why does removing the delay cause it to hang?
