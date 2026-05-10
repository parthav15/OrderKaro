# Getting Started

This guide will walk you through setting up and running the OrderKaro project locally. Please follow each step carefully.

### Prerequisites

Ensure you have the following installed on your development machine:

*   **Node.js**: Version 18.x or higher (Node.js 20 LTS is recommended).
*   **pnpm**: Version 10.30.0 (or compatible). Install globally: `npm install -g pnpm`.
*   **PostgreSQL**: A running PostgreSQL database instance (version 12+ recommended). You can use Docker for easy setup:
    ```bash
    docker run --name orderkaro-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
    ```
*   **Redis**: A running Redis instance. You can use Docker for easy setup:
    ```bash
    docker run --name orderkaro-redis -p 6379:6379 -d redis/redis-stack-server:latest
    ```
*   **Git**: For cloning the repository.
*   **Expo Go app (for mobile)**: Install on your physical device or emulator.
*   **Android Studio / Xcode (for mobile development)**: Necessary if you plan to run on emulators or build native apps.

### Step-by-step Setup

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd orderkaro
    ```

2.  **Install Dependencies**:
    This is a Turborepo monorepo. Navigate to the project root and install all dependencies:
    ```bash
    pnpm install
    ```

3.  **Configure Environment Variables**:
    *   **Root `.env` for API and Web App**:
        Create a `.env` file in the project root by copying the example:
        ```bash
        cp .env.example .env
        ```
        Open `.env` and fill in the details. For `DATABASE_URL`, ensure the `user`, `password`, and `orderkaro` database exist in your PostgreSQL setup.
        ```
        DATABASE_URL="postgresql://postgres:password@localhost:5432/orderkaro" # Update if needed
        REDIS_URL="redis://localhost:6379" # Update if needed
        JWT_SECRET="super-secret-jwt-key-for-access-tokens" # CHANGE THIS IN PRODUCTION
        JWT_REFRESH_SECRET="super-secret-jwt-key-for-refresh-tokens" # CHANGE THIS IN PRODUCTION
        CLOUDINARY_CLOUD_NAME="" # Required for image uploads, get from Cloudinary account
        CLOUDINARY_API_KEY=""    # Get from Cloudinary account
        CLOUDINARY_API_SECRET="" # Get from Cloudinary account
        NEXT_PUBLIC_API_URL="http://localhost:5000"
        NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
        PORT=5000
        SUPER_ADMIN_EMAIL="admin@orderkaro.com" # Default email for super admin role
        ```
    *   **`apps/mobile/.env` for Mobile App**:
        Create a `.env` file inside the `apps/mobile/` directory:
        ```bash
        cp apps/mobile/.env.example apps/mobile/.env
        ```
        Edit `apps/mobile/.env`. **Important**: If running on a physical mobile device or emulator, replace `192.168.1.100` with your local machine's actual IP address.
        ```
        EXPO_PUBLIC_API_URL=http://192.168.1.100:5000 # Use your machine's local IP address
        EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:5000 # Use your machine's local IP address
        ```

4.  **Database Setup**:
    *   **Generate Prisma Client**: This command reads your `schema.prisma` and generates the TypeScript client.
        ```bash
        pnpm db:generate
        ```
    *   **Apply Migrations and Seed Data**: This will create the necessary database tables and populate them with initial data (a test owner, canteen, menu, etc.).
        ```bash
        pnpm db:migrate # Creates and applies migrations
        pnpm db:seed    # Runs the seed script
        ```
        *   **Note**: The seed script (`apps/api/prisma/seed.ts`) will create an owner: `admin@orderkaro.com` with password `password123`. For staff login, a kitchen staff `kitchen@orderkaro.com` with password `kitchen123` and PIN `5678` is created for `Campus Cafe`. A consumer `9999999999` with PIN `1234` is also created.

5.  **Run the Applications**:
    Open three separate terminal windows from the project root.

    *   **Terminal 1: Start the API Server (`apps/api`)**:
        ```bash
        pnpm dev --filter=api
        # API server will be running on http://localhost:5000
        ```

    *   **Terminal 2: Start the Web Application (`apps/web`)**:
        ```bash
        pnpm dev --filter=web
        # Web application will be running on http://localhost:3000
        ```

    *   **Terminal 3: Start the Mobile Application (`apps/mobile`)**:
        ```bash
        pnpm start --filter=mobile
        # This will open the Expo Dev Tools in your browser.
        # Scan the QR code with the Expo Go app on your phone/emulator.
        ```

### Common Errors and Their Fixes

*   **`pnpm` command not found**: Ensure `pnpm` is installed globally (`npm install -g pnpm`).
*   **Database connection errors**:
    *   Verify `DATABASE_URL` in your `.env` file is correct and points to a running PostgreSQL instance.
    *   Check your PostgreSQL container/server logs for errors.
    *   Ensure the `orderkaro` database and `postgres` user (or your configured user) exist and have appropriate permissions.
*   **Prisma Client not found or type errors related to Prisma**:
    *   After making changes to `schema.prisma`, always run `pnpm db:generate`.
    *   If `pnpm db:migrate` fails due to schema conflicts, you might need to resolve them manually or, for local development, consider running `npx prisma migrate reset` (which will wipe your DB data!) then `pnpm db:migrate` and `pnpm db:seed` again.
*   **Mobile app cannot connect to API/Socket**:
    *   Double-check `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` in `apps/mobile/.env`. For physical devices/emulators, this *must* be your development machine's local IP address, not `localhost`.
    *   Ensure your device/emulator is on the same Wi-Fi network as your development machine.
    *   Temporarily disable your machine's firewall to rule out network blocking.
*   **TypeScript build errors**:
    *   Run `pnpm typecheck` or `pnpm lint` to identify specific errors.
    *   Often, a fresh `pnpm install` and `pnpm db:generate` can resolve dependency-related type issues.

### How to add a new API endpoint

Let's walk through adding a new API endpoint to manage `Discount`s:

1.  **Define Schema in `packages/shared`**:
    *   Create a Zod schema for your new entity in `packages/shared/src/schemas/discount.ts`:
        ```typescript
        // packages/shared/src/schemas/discount.ts
        import { z } from "zod";
        export const createDiscountSchema = z.object({ /* ... fields ... */ });
        export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
        ```
    *   Export it from `packages/shared/src/index.ts`:
        ```typescript
        // packages/shared/src/index.ts
        export * from "./schemas/discount"; // Add this line
        // ... other exports
        ```

2.  **Define Prisma Model in `apps/api/prisma/schema.prisma` and `apps/web/prisma/schema.prisma`**:
    *   Add your `Discount` model definition to `apps/api/prisma/schema.prisma` and `apps/web/prisma/schema.prisma`:
        ```prisma
        // ... (existing models)
        model Discount {
          id          String    @id @default(uuid())
          canteenId   String
          canteen     Canteen   @relation(fields: [canteenId], references: [id], onDelete: Cascade)
          code        String
          percentage  Decimal   @db.Decimal(5, 2)
          expiresAt   DateTime?
          isActive    Boolean   @default(true)
          createdAt   DateTime  @default(now())
          updatedAt   DateTime  @updatedAt

          @@unique([canteenId, code]) // Discount code unique per canteen
          @@index([canteenId, isActive])
        }
        ```
    *   Update the `Canteen` model to include the new relationship:
        ```prisma
        // ... (Canteen model)
        model Canteen {
          // ... existing fields
          discounts   Discount[] // Add this line
        }
        ```
    *   Run Prisma commands to update the database and client:
        ```bash
        pnpm db:migrate # Follow prompts to name your migration (e.g., "add_discount_model")
        pnpm db:generate
        ```

3.  **Create Controller in `apps/api`**:
    *   Create `apps/api/src/modules/discount/discount.controller.ts` with your endpoint logic:
        ```typescript
        // apps/api/src/modules/discount/discount.controller.ts
        import type { Request, Response } from "express";
        import prisma from "../../config/database";
        import { success, created, error } from "../../utils/response";
        import type { CreateDiscountInput } from "@orderkaro/shared";

        export async function createDiscount(req: Request, res: Response) {
          const data = req.body as CreateDiscountInput;
          const canteenId = req.params.canteenId as string;
          // ... implementation
          return created(res, discount);
        }
        // ... other functions (e.g., getDiscounts)
        ```

4.  **Create Routes in `apps/api`**:
    *   Create `apps/api/src/modules/discount/discount.routes.ts` and import controller/schema:
        ```typescript
        // apps/api/src/modules/discount/discount.routes.ts
        import { Router } from "express";
        import { authenticate, authorize, validate } from "../../middleware"; // assuming grouped middleware
        import { createDiscountSchema } from "@orderkaro/shared";
        import * as controller from "./discount.controller";

        const router = Router();
        const auth = [authenticate, authorize("OWNER", "MANAGER")]; // Define roles

        router.post("/:canteenId/discounts", ...auth, validate(createDiscountSchema), controller.createDiscount);
        router.get("/:canteenId/discounts", ...auth, controller.getDiscounts);

        export default router;
        ```

5.  **Register Routes in `apps/api/src/index.ts`**:
    *   Import and use your new routes in the main API entry point:
        ```typescript
        // apps/api/src/index.ts
        import discountRoutes from "./modules/discount/discount.routes"; // Add this
        // ... other imports

        app.use("/api/v1/canteens", discountRoutes); // Integrate into existing /canteens routes
        // ... other app.use calls
        ```
    Your new API endpoints (e.g., `POST /api/v1/canteens/:canteenId/discounts`) are now active!

### How to add a new database table/model

This process is closely tied to the steps for adding a new API endpoint, specifically involving Prisma.

1.  **Define the Model in `schema.prisma`**:
    *   Open `apps/api/prisma/schema.prisma` and `apps/web/prisma/schema.prisma`.
    *   Add your new model definition. For example, let's add a `Feedback` model:
        ```prisma
        // apps/api/prisma/schema.prisma
        // ... (existing models)

        model Feedback {
          id          String    @id @default(uuid())
          consumerId  String
          consumer    Consumer  @relation(fields: [consumerId], references: [id], onDelete: Cascade)
          canteenId   String
          canteen     Canteen   @relation(fields: [canteenId], references: [id], onDelete: Cascade)
          rating      Int       @min(1) @max(5)
          comment     String?   @db.Text
          createdAt   DateTime  @default(now())

          @@index([consumerId])
          @@index([canteenId])
        }
        ```
    *   If your new model relates to existing ones, update those existing models to include the new relationship. For `Feedback`, you might add `feedback Feedback[]` to the `Consumer` and `Canteen` models.

2.  **Generate Prisma Client**:
    *   After modifying `schema.prisma`, you must update the Prisma Client to reflect these changes in your TypeScript code:
        ```bash
        pnpm db:generate
        ```
    This ensures that your new `Feedback` model is available as `prisma.feedback` and correctly typed.

3.  **Create and Apply Migrations**:
    *   Generate a new migration file that captures the schema changes and applies them to your database:
        ```bash
        pnpm db:migrate
        ```
    *   Follow the prompts to provide a meaningful name for your migration (e.g., `add_feedback_model`). Prisma will generate the necessary SQL files and apply them to your database.

### Useful Commands

These commands should be run from the project root directory.

*   **`pnpm dev`**:
    *   Starts all `apps` in development mode (API, Web, Mobile). Turborepo will orchestrate the builds and serve each application.
*   **`pnpm dev --filter=<app-name>`**:
    *   Starts a specific application in development mode (e.g., `pnpm dev --filter=api` to run only the API server).
*   **`pnpm build`**:
    *   Builds all applications for production.
*   **`pnpm build --filter=<app-name>`**:
    *   Builds a specific application for production (e.g., `pnpm build --filter=web`).
*   **`pnpm lint`**:
    *   Runs ESLint across the entire monorepo to check for code style and potential errors.
*   **`pnpm lint --filter=<app-name>`**:
    *   Lints a specific application.
*   **`pnpm typecheck`**:
    *   Runs TypeScript's type checker across all packages to ensure type safety.
*   **`pnpm db:generate`**:
    *   Generates or updates the Prisma Client based on `schema.prisma`. **Run this whenever `schema.prisma` is changed.**
*   **`pnpm db:migrate`**:
    *   Compares `schema.prisma` with the current database state, generates a new migration file (if changes are detected), and applies it to the database. Essential for evolving the database schema.
*   **`pnpm db:push`**:
    *   Directly pushes the current `schema.prisma` schema to the database, skipping migration file generation. Useful for quick prototyping/local development, but **avoid on shared or production databases.**
*   **`pnpm db:seed`**:
    *   Executes the database seeding script (`apps/api/prisma/seed.ts`) to populate initial data.