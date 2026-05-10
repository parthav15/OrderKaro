# Architecture Overview

OrderKaro is a comprehensive canteen management system designed to streamline food ordering, preparation, and delivery for educational institutions or similar environments. It enables canteen owners to manage their menu, staff, tables (via QR codes), and orders efficiently, while consumers can easily scan, order, track, and pay for their food using a dedicated mobile app or web interface. The system also includes a wallet feature for seamless payments and analytics for business insights.

**Tech Stack with Specific Versions:**

*   **Monorepo Tool**: Turborepo (`turbo@2.4.0`)
*   **Package Manager**: pnpm (`pnpm@10.30.0`)
*   **Primary Language**: TypeScript (shared `5.7.0`, web `5.7.0`, mobile `~5.9.2`, api `5.7.0`)
*   **Backend (API)**: Express.js (`express@4.21.0`), tsx (`tsx@4.19.0`) for development.
*   **Frontend (Web)**: Next.js (`next@14.2.0`), React (`react@18.3.0`), Tailwind CSS (`tailwindcss@3.4.17`), Framer Motion (`framer-motion@11.15.0`).
*   **Frontend (Mobile)**: Expo (`expo@~54.0.33`), React Native (`react-native@0.81.5`), Expo Router (`expo-router@~6.0.23`), React Native Reanimated (`react-native-reanimated@~4.1.1`).
*   **Database**: PostgreSQL (managed by Prisma ORM).
*   **ORM**: Prisma (`prisma@6.19.2` for web, `prisma@6.4.0` for api), Prisma Client (`@prisma/client@6.19.2` for web, `@prisma/client@6.4.0` for api).
*   **Real-time Communication**: Socket.IO (`socket.io@4.8.0`, `socket.io-client@4.8.0` web, `4.7.0` mobile).
*   **Data Validation**: Zod (`zod@3.23.0`).
*   **Authentication**: JSON Web Tokens (JWT) (`jsonwebtoken@9.0.3` web, `9.0.2` api), bcryptjs (`bcryptjs@2.4.3`).
*   **State Management**: Zustand (`zustand@5.0.0` web, `5.0.11` mobile).
*   **Data Fetching/Caching**: Tanstack Query (`@tanstack/react-query@5.62.0` web, `5.60.0` mobile), Axios (`axios@1.7.0`).
*   **Cloud Storage**: Cloudinary (for image uploads).
*   **Other Tools**: QRCode (`qrcode@1.5.4`).

**Folder Structure:**

*   `./`: The root of the Turborepo monorepo. Contains global configuration files like `package.json`, `pnpm-workspace.yaml`, and `.env.example`.
*   `apps/`: This directory holds all the independent applications within the monorepo.
    *   `api/`: The backend Express.js API server. It handles all business logic, database interactions, and real-time communication.
    *   `web/`: The Next.js web application. This serves as the administrative dashboard for canteen owners/staff and a public-facing menu/tracking interface for consumers (PWA-enabled).
    *   `mobile/`: The Expo/React Native mobile application, primarily for consumers to scan QR codes, order, track, and manage their wallet.
*   `packages/`: This directory contains shared code that can be reused across different applications.
    *   `shared/`: A TypeScript package defining common types, Zod schemas for API validation, and constants used by both the frontend and backend.

**Data Flow: Consumer Places an Order (Typical Action)**

1.  **Frontend Interaction (Web/Mobile)**:
    *   A consumer scans a QR code at a canteen table using `apps/mobile/app/index.tsx` or navigates directly to the canteen's URL in `apps/web/src/app/(consumer)/[slug]/menu/page.tsx`.
    *   The QR code is resolved (`/api/v1/public/resolve-qr/:qrToken`), and the consumer identifies themselves (`/api/v1/public/identify`) or logs in.
    *   The consumer browses the menu items (fetched from `/api/v1/public/canteen/:slug/menu` in `apps/mobile/app/(tabs)/menu.tsx` or `apps/web/src/app/(consumer)/[slug]/menu/page.tsx`) and adds selected items to their cart, managed by `useCartStore` (`apps/mobile/stores/cart.ts` or `apps/web/src/stores/cart.ts`).
    *   They proceed to the cart page (`apps/mobile/app/(tabs)/cart.tsx` or `apps/web/src/app/(consumer)/[slug]/cart/page.tsx`) and click "Place Order".

2.  **API Call (Frontend to Backend)**:
    *   The frontend (e.g., `apps/mobile/app/(tabs)/cart.tsx`) dispatches an authenticated `POST` request to the API endpoint `/api/v1/canteens/:canteenId/orders` with the order details and payment method (Cash/Wallet). An idempotency key (`generateUUID` from `apps/mobile/lib/utils.ts` or `apps/web/src/lib/utils.ts`) is included to prevent duplicate orders.

3.  **API Route Handling & Validation (`apps/api/`)**:
    *   The request reaches `apps/api/src/index.ts` and is routed to `apps/api/src/modules/order/order.routes.ts`.
    *   **Authentication Middleware** (`apps/api/src/middleware/auth.ts`): The `authenticate` middleware verifies the consumer's JWT from the `Authorization` header, extracting their `id` and `role`.
    *   **Authorization Middleware** (`apps/api/src/middleware/auth.ts`): The `authorize("CONSUMER")` middleware ensures only consumers can place orders.
    *   **Validation Middleware** (`apps/api/src/middleware/validate.ts`): The request body is validated against `placeOrderSchema` from `packages/shared/src/schemas/order.ts` using Zod.

4.  **Controller Logic & Database Operation (`apps/api/`)**:
    *   The `placeOrder` function in `apps/api/src/modules/order/order.controller.ts` executes.
    *   It performs checks (e.g., idempotency, canteen capacity `maxActiveOrders`, consumer's active order limit `MAX_ACTIVE_ORDERS_PER_SESSION` from `packages/shared/src/constants.ts`).
    *   It fetches menu item details (including customizations) from the database (`apps/api/src/config/database.ts` Prisma client) to calculate the `totalAmount`.
    *   If the payment method is `WALLET`, it verifies the consumer's wallet balance.
    *   A `prisma.$transaction` is used to ensure atomicity:
        *   A new `Order` record is created in the database.
        *   Associated `OrderItem` records are created.
        *   An `OrderStatusLog` entry for "PLACED" is created.
        *   If `WALLET` payment, the consumer's `Wallet` balance is debited, and a `WalletTransaction` record is created.
    *   **Real-time Update**: `getIO().to('canteen:kitchen').emit('order:new', order)` (from `apps/api/src/socket/index.ts`) immediately notifies kitchen and counter staff about the new order via Socket.IO.

5.  **API Response**:
    *   The API returns a `201 Created` response with the newly created `Order` object and a `trackingUrl` using `apps/api/src/utils/response.ts`.

6.  **Frontend Update**:
    *   The frontend receives the successful response.
    *   The cart is cleared (`useCartStore().clearCart()`).
    *   If PWA is supported, notification permission might be requested (`apps/web/src/lib/pwa.ts`).
    *   The user is redirected to the order tracking page (`apps/mobile/app/track/[token].tsx` or `apps/web/src/app/(consumer)/[slug]/track/[token]/page.tsx`) to view live updates.

**Key Design Patterns Used:**

*   **Monorepo (Turborepo)**: Facilitates code sharing and efficient management of multiple related projects (`apps` and `packages/shared`) from a single repository.
*   **Layered Architecture (API)**: Clear separation of concerns with `routes`, `middleware`, `controllers`, and a database layer using Prisma.
*   **Schema-First Validation (Zod)**: All incoming API request bodies are rigorously validated against Zod schemas defined in `packages/shared/src/schemas/`, ensuring data integrity and type safety across the stack.
*   **Object-Relational Mapping (Prisma)**: Provides a type-safe way to interact with the PostgreSQL database, abstracting SQL queries and simplifying data operations.
*   **JSON Web Tokens (JWT)**: Used for stateless authentication and role-based authorization, providing `accessToken` (short-lived) and `refreshToken` (long-lived) for session management.
*   **Real-time Communication (Socket.IO)**: Enables instant updates for critical events (e.g., new orders, order status changes) to relevant clients (kitchen, counter, consumer).
*   **Global State Management (Zustand)**: Simplifies state management in React applications (web and mobile), with middleware for persisting state to local storage.
*   **Client-Side Data Fetching & Caching (Tanstack Query)**: Manages asynchronous data fetching, caching, synchronization, and error handling for a robust user experience.
*   **Progressive Web App (PWA)**: The web application leverages a service worker (`apps/web/public/sw.js`) for offline capabilities and push notifications, enhancing user engagement and reliability.
*   **Next.js API Routes**: For specific serverless API endpoints within the Next.js frontend, often mirroring or complementing the main Express API for specific needs (e.g., image upload).

**Environment Variables:**

These variables are crucial for configuring the application across different environments.

*   **`DATABASE_URL`** (root `.env`, `apps/mobile/.env`): PostgreSQL connection string. This is used by Prisma to connect to the database.
*   **`REDIS_URL`** (root `.env`): Redis connection string. While present, the provided snippets do not show active usage in the code, suggesting it might be for future features or external caching.
*   **`JWT_SECRET`** (root `.env`): A strong secret key used for signing and verifying JWT access tokens. Essential for authentication security.
*   **`JWT_REFRESH_SECRET`** (root `.env`): A strong secret key used for signing and verifying JWT refresh tokens. Used to issue new access tokens without re-authenticating the user.
*   **`CLOUDINARY_CLOUD_NAME`** (root `.env`): Your Cloudinary cloud name, necessary for authenticating image uploads.
*   **`CLOUDINARY_API_KEY`** (root `.env`): Your Cloudinary API key for authentication.
*   **`CLOUDINARY_API_SECRET`** (root `.env`): Your Cloudinary API secret for secure API requests.
*   **`NEXT_PUBLIC_API_URL`** (root `.env`): The base URL for the backend API server. The web frontend (`apps/web`) uses this to make API requests.
*   **`NEXT_PUBLIC_SOCKET_URL`** (root `.env`): The base URL for the Socket.IO server. The web frontend (`apps/web`) uses this for real-time communication.
*   **`PORT`** (root `.env`): The port on which the Express.js API server (`apps/api`) listens for incoming requests (e.g., `5000`).
*   **`SUPER_ADMIN_EMAIL`** (root `.env`): The email address of the designated "Super Admin" account, which has special privileges across the system.
*   **`EXPO_PUBLIC_API_URL`** (`apps/mobile/.env`): The base URL for the backend API server specifically for the mobile application. Crucial for connecting the mobile app to the backend.
*   **`EXPO_PUBLIC_SOCKET_URL`** (`apps/mobile/.env`): The base URL for the Socket.IO server specifically for the mobile application, used for real-time updates.