# Database Schema

The database schema is defined using Prisma in `apps/web/prisma/schema.prisma` and `apps/api/prisma/schema.prisma`. Both are identical, ensuring a consistent data model across the backend and web application. The provider is PostgreSQL.

**Models (Tables):**

1.  **`Owner`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default) - Unique identifier.
        *   `email`: `String` (Unique) - Owner's email.
        *   `passwordHash`: `String` - Hashed password.
        *   `name`: `String` - Owner's name.
        *   `phone`: `String` - Owner's phone number.
        *   `isVerified`: `Boolean` (Default: `false`) - Verification status.
        *   `createdAt`: `DateTime` (Default: `now()`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Relationships**: `canteens Canteen[]` (An Owner has many Canteens).

2.  **`Canteen`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `ownerId`: `String` (FK to `Owner`)
        *   `name`: `String`
        *   `slug`: `String` (Unique) - URL-friendly identifier.
        *   `description`: `String?` (Optional)
        *   `logoUrl`: `String?` (Optional)
        *   `bannerUrl`: `String?` (Optional)
        *   `address`: `String?` (Optional)
        *   `phone`: `String?` (Optional)
        *   `isActive`: `Boolean` (Default: `true`)
        *   `openingTime`: `String` (Default: "08:00")
        *   `closingTime`: `String` (Default: "22:00")
        *   `avgPrepTime`: `Int` (Default: `15`) - Average order preparation time in minutes.
        *   `maxActiveOrders`: `Int` (Default: `50`) - Maximum concurrent active orders.
        *   `createdAt`: `DateTime` (Default: `now()`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Relationships**: `owner Owner` (Belongs to one Owner). `staff Staff[]`, `categories Category[]`, `tables Table[]`, `orders Order[]`, `announcements Announcement[]` (Has many Staff, Categories, Tables, Orders, Announcements).

3.  **`Staff`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `canteenId`: `String` (FK to `Canteen`)
        *   `email`: `String`
        *   `passwordHash`: `String`
        *   `pin`: `String?` (Optional) - 4-digit PIN for quick login.
        *   `name`: `String`
        *   `role`: `StaffRole` (Enum: `MANAGER`, `KITCHEN`, `COUNTER`)
        *   `isActive`: `Boolean` (Default: `true`)
        *   `createdAt`: `DateTime` (Default: `now()`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Constraints**: `@@unique([canteenId, email])` (Email must be unique within a canteen).
    *   **Indexes**: `@@index([canteenId, isActive])`, `@@index([canteenId, pin])`.
    *   **Relationships**: `canteen Canteen` (Belongs to one Canteen).

4.  **`Category`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `canteenId`: `String` (FK to `Canteen`)
        *   `name`: `String`
        *   `description`: `String?` (Optional)
        *   `imageUrl`: `String?` (Optional)
        *   `sortOrder`: `Int` (Default: `0`)
        *   `isActive`: `Boolean` (Default: `true`)
        *   `createdAt`: `DateTime` (Default: `now()`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Indexes**: `@@index([canteenId, sortOrder])`.
    *   **Relationships**: `canteen Canteen` (Belongs to one Canteen). `items MenuItem[]` (Has many Menu Items).

5.  **`MenuItem`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `categoryId`: `String` (FK to `Category`)
        *   `name`: `String`
        *   `description`: `String?` (Optional)
        *   `price`: `Decimal` (`@db.Decimal(10, 2)`)
        *   `imageUrl`: `String?` (Optional)
        *   `isVeg`: `Boolean` (Default: `true`)
        *   `isAvailable`: `Boolean` (Default: `true`)
        *   `prepTimeMin`: `Int?` (Optional)
        *   `sortOrder`: `Int` (Default: `0`)
        *   `tags`: `String[]` (Default: `[]`)
        *   `createdAt`: `DateTime` (Default: `now()`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Indexes**: `@@index([categoryId, sortOrder])`.
    *   **Relationships**: `category Category` (Belongs to one Category). `customizations Customization[]`, `orderItems OrderItem[]` (Has many Customizations and Order Items).

6.  **`Customization`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `menuItemId`: `String` (FK to `MenuItem`)
        *   `name`: `String`
        *   `type`: `CustomizationType` (Enum: `SINGLE_SELECT`, `MULTI_SELECT`)
        *   `isRequired`: `Boolean` (Default: `false`)
        *   `minSelect`: `Int` (Default: `0`)
        *   `maxSelect`: `Int` (Default: `1`)
    *   **Relationships**: `menuItem MenuItem` (Belongs to one Menu Item). `options CustomizationOption[]` (Has many Customization Options).

7.  **`CustomizationOption`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `customizationId`: `String` (FK to `Customization`)
        *   `name`: `String`
        *   `priceAdjustment`: `Decimal` (Default: `0`, `@db.Decimal(10, 2)`)
        *   `isDefault`: `Boolean` (Default: `false`)
        *   `sortOrder`: `Int` (Default: `0`)
    *   **Relationships**: `customization Customization` (Belongs to one Customization).

8.  **`Table`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `canteenId`: `String` (FK to `Canteen`)
        *   `label`: `String`
        *   `qrCodeUrl`: `String?` (Optional)
        *   `qrToken`: `String` (Unique, UUID default) - Token used in QR code URLs.
        *   `isActive`: `Boolean` (Default: `true`)
        *   `section`: `String?` (Optional)
        *   `createdAt`: `DateTime` (Default: `now()`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Constraints**: `@@unique([canteenId, label])` (Label must be unique per canteen).
    *   **Relationships**: `canteen Canteen` (Belongs to one Canteen). `orders Order[]` (Has many Orders).

9.  **`Consumer`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `name`: `String`
        *   `phone`: `String` (Unique)
        *   `passwordHash`: `String?` (Optional) - Hashed PIN/password.
        *   `createdAt`: `DateTime` (Default: `now()`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Relationships**: `wallet Wallet?` (Has one optional Wallet). `orders Order[]` (Has many Orders). `deviceTokens DeviceToken[]` (Has many Device Tokens).

10. **`DeviceToken`** (Only in `apps/web/prisma/schema.prisma`)
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `consumerId`: `String` (FK to `Consumer`)
        *   `token`: `String` (Unique) - Push notification token.
        *   `platform`: `String` - Device platform (e.g., "android", "ios", "web").
        *   `createdAt`: `DateTime` (Default: `now()`)
    *   **Indexes**: `@@index([consumerId])`.
    *   **Relationships**: `consumer Consumer` (Belongs to one Consumer).

11. **`Wallet`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `consumerId`: `String` (Unique, FK to `Consumer`)
        *   `balance`: `Decimal` (Default: `0`, `@db.Decimal(10, 2)`)
        *   `updatedAt`: `DateTime` (`@updatedAt`)
    *   **Relationships**: `consumer Consumer` (Belongs to one Consumer). `transactions WalletTransaction[]` (Has many Wallet Transactions).

12. **`WalletTransaction`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `walletId`: `String` (FK to `Wallet`)
        *   `type`: `WalletTransactionType` (Enum: `CREDIT`, `DEBIT`)
        *   `amount`: `Decimal` (`@db.Decimal(10, 2)`)
        *   `balanceBefore`: `Decimal` (`@db.Decimal(10, 2)`)
        *   `balanceAfter`: `Decimal` (`@db.Decimal(10, 2)`)
        *   `source`: `WalletTransactionSource` (Enum: `CASH_DEPOSIT`, `BANK_TRANSFER`, `ORDER_PAYMENT`, `REFUND`)
        *   `description`: `String?` (Optional)
        *   `reference`: `String?` (Optional)
        *   `approvedBy`: `String?` (Optional)
        *   `status`: `WalletRequestStatus` (Default: `APPROVED`, Enum: `PENDING`, `APPROVED`, `REJECTED`)
        *   `createdAt`: `DateTime` (Default: `now()`)
    *   **Indexes**: `@@index([walletId, createdAt])`, `@@index([status, source])`.
    *   **Relationships**: `wallet Wallet` (Belongs to one Wallet).

13. **`Order`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `orderNumber`: `Int`
        *   `canteenId`: `String` (FK to `Canteen`)
        *   `tableId`: `String` (FK to `Table`)
        *   `consumerId`: `String` (FK to `Consumer`)
        *   `status`: `OrderStatus` (Default: `PLACED`, Enum: `PLACED`, `ACCEPTED`, `PREPARING`, `READY`, `PICKED_UP`, `CANCELLED`)
        *   `totalAmount`: `Decimal` (`@db.Decimal(10, 2)`)
        *   `specialInstructions`: `String?` (Optional)
        *   `estimatedReadyAt`: `DateTime?` (Optional)
        *   `paymentStatus`: `PaymentStatus` (Default: `PENDING`, Enum: `PENDING`, `PAID`, `REFUNDED`)
        *   `paymentMethod`: `PaymentMethod` (Enum: `CASH`, `WALLET`)
        *   `walletTransactionId`: `String?` (Unique, Optional) - Reference to a wallet transaction if paid via wallet.
        *   `idempotencyKey`: `String?` (Unique, Optional) - To prevent duplicate order submission.
        *   `trackingToken`: `String?` (Unique, Optional) - For public order tracking.
        *   `placedAt`: `DateTime` (Default: `now()`)
        *   `acceptedAt`: `DateTime?` (Optional)
        *   `preparingAt`: `DateTime?` (Optional)
        *   `readyAt`: `DateTime?` (Optional)
        *   `pickedUpAt`: `DateTime?` (Optional)
        *   `cancelledAt`: `DateTime?` (Optional)
    *   **Indexes**: `@@index([canteenId, status])`, `@@index([canteenId, placedAt])`, `@@index([consumerId, placedAt])`.
    *   **Relationships**: `canteen Canteen`, `table Table`, `consumer Consumer` (Belongs to one Canteen, Table, and Consumer). `items OrderItem[]`, `statusLogs OrderStatusLog[]` (Has many Order Items and Order Status Logs).

14. **`OrderItem`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `orderId`: `String` (FK to `Order`)
        *   `menuItemId`: `String` (FK to `MenuItem`)
        *   `quantity`: `Int`
        *   `unitPrice`: `Decimal` (`@db.Decimal(10, 2)`)
        *   `totalPrice`: `Decimal` (`@db.Decimal(10, 2)`)
        *   `selectedOptions`: `Json` (Default: `"[]"`) - Stores selected customizations as JSON.
        *   `notes`: `String?` (Optional)
    *   **Relationships**: `order Order`, `menuItem MenuItem` (Belongs to one Order and one Menu Item).

15. **`OrderStatusLog`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `orderId`: `String` (FK to `Order`)
        *   `fromStatus`: `String?` (Optional)
        *   `toStatus`: `String`
        *   `changedBy`: `String?` (Optional)
        *   `note`: `String?` (Optional)
        *   `createdAt`: `DateTime` (Default: `now()`)
    *   **Indexes**: `@@index([orderId, createdAt])`.
    *   **Relationships**: `order Order` (Belongs to one Order).

16. **`Announcement`**
    *   **Fields**:
        *   `id`: `String` (PK, UUID default)
        *   `canteenId`: `String` (FK to `Canteen`)
        *   `message`: `String`
        *   `isActive`: `Boolean` (Default: `true`)
        *   `expiresAt`: `DateTime?` (Optional)
        *   `createdAt`: `DateTime` (Default: `now()`)
    *   **Indexes**: `@@index([canteenId, isActive])`.
    *   **Relationships**: `canteen Canteen` (Belongs to one Canteen).

**Enums:**
*   `StaffRole`: `MANAGER`, `KITCHEN`, `COUNTER`
*   `CustomizationType`: `SINGLE_SELECT`, `MULTI_SELECT`
*   `OrderStatus`: `PLACED`, `ACCEPTED`, `PREPARING`, `READY`, `PICKED_UP`, `CANCELLED`
*   `PaymentStatus`: `PENDING`, `PAID`, `REFUNDED`
*   `PaymentMethod`: `CASH`, `WALLET`
*   `WalletTransactionType`: `CREDIT`, `DEBIT`
*   `WalletTransactionSource`: `CASH_DEPOSIT`, `BANK_TRANSFER`, `ORDER_PAYMENT`, `REFUND`
*   `WalletRequestStatus`: `PENDING`, `APPROVED`, `REJECTED`

**Migration Patterns and Seed Data:**

*   **Migrations**: The project uses Prisma Migrate (`pnpm db:migrate`). When changes are made to `schema.prisma`, `pnpm db:migrate` is run to generate new SQL migration files and apply them, tracking schema versions.
*   **Seed Data**:
    *   `apps/api/prisma/seed.ts`: This script populates the database with essential initial data for development/testing, including a default owner (`admin@orderkaro.com` / `password123`), a sample canteen (`Campus Cafe`), a kitchen staff, sample categories, and menu items. It also creates a test consumer with a wallet.
    *   `apps/web/prisma/seed.ts`: A similar seed file primarily used for local development of the web app.
    *   `apps/web/prisma/update-menu.ts`: A specialized script likely used to populate a more extensive menu for a specific canteen (`sachidanandsabrwal@gmail.com`) for demo or production environment setup.