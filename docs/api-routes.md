# API Routes

This section documents all API endpoints available in the OrderKaro project, encompassing both the main Express.js API server (`apps/api`) and the Next.js API routes (`apps/web`).

**API Server (`apps/api/`) Routes:**

| Method | Path                                          | Description                                                 | Auth Required               |
| :----- | :-------------------------------------------- | :---------------------------------------------------------- | :-------------------------- |
| GET    | `/api/health`                                 | Checks API server health.                                   | No                          |
| POST   | `/api/v1/public/identify`                     | Identifies or creates a consumer for public menu access.    | No                          |
| GET    | `/api/v1/public/resolve-qr/:qrToken`          | Resolves QR code to canteen/table info.                     | No                          |
| GET    | `/api/v1/public/canteen/:slug/menu`           | Retrieves public menu for a given canteen.                  | No                          |
| GET    | `/api/v1/public/track/:trackingToken`         | Tracks the status of a specific order.                      | No                          |
| POST   | `/api/v1/auth/owner/register`                 | Registers a new canteen owner.                              | No                          |
| POST   | `/api/v1/auth/owner/login`                    | Authenticates an owner.                                     | No                          |
| POST   | `/api/v1/auth/staff/login`                    | Authenticates a staff member.                               | No                          |
| POST   | `/api/v1/auth/staff/pin-login`                | Authenticates a staff member using a PIN.                   | No                          |
| POST   | `/api/v1/auth/consumer/register`              | Registers a new consumer.                                   | No                          |
| POST   | `/api/v1/auth/consumer/login`                 | Authenticates a consumer.                                   | No                          |
| POST   | `/api/v1/auth/refresh`                        | Refreshes access token using refresh token.                 | No                          |
| POST   | `/api/v1/canteens`                            | Creates a new canteen.                                      | OWNER                       |
| GET    | `/api/v1/canteens`                            | Lists canteens owned by the authenticated owner.            | OWNER                       |
| GET    | `/api/v1/canteens/:id`                        | Retrieves details for a specific canteen.                   | OWNER                       |
| PUT    | `/api/v1/canteens/:id`                        | Updates details for a specific canteen.                     | OWNER                       |
| DELETE | `/api/v1/canteens/:id`                        | Deletes a specific canteen.                                 | OWNER                       |
| POST   | `/api/v1/canteens/:canteenId/tables`          | Creates a new table for a canteen.                          | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/tables`          | Lists tables for a canteen.                                 | OWNER, MANAGER              |
| PUT    | `/api/v1/canteens/:canteenId/tables/:tableId` | Updates a specific table.                                   | OWNER, MANAGER              |
| DELETE | `/api/v1/canteens/:canteenId/tables/:tableId` | Deletes a specific table.                                   | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/tables/:tableId/qr` | Generates QR code data for a table.                         | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/tables/bulk-qr`  | Generates QR code data for all active tables in a canteen.  | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/staff`           | Creates a new staff member for a canteen.                   | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/staff`           | Lists staff members for a canteen.                          | OWNER, MANAGER              |
| PUT    | `/api/v1/canteens/:canteenId/staff/:staffId`  | Updates a staff member's details.                           | OWNER, MANAGER              |
| DELETE | `/api/v1/canteens/:canteenId/staff/:staffId`  | Deletes a staff member.                                     | OWNER, MANAGER              |
| PATCH  | `/api/v1/canteens/:canteenId/staff/:staffId/toggle` | Toggles a staff member's active status.                     | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/menu`            | Retrieves full menu (categories, items, customizations).    | Authenticated (all roles)   |
| POST   | `/api/v1/canteens/:canteenId/categories`      | Creates a new menu category.                                | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/categories`      | Lists menu categories for a canteen.                        | OWNER, MANAGER              |
| PUT    | `/api/v1/canteens/:canteenId/categories/:catId` | Updates a specific menu category.                           | OWNER, MANAGER              |
| DELETE | `/api/v1/canteens/:canteenId/categories/:catId` | Deletes a specific menu category.                           | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/menu/items`      | Creates a new menu item.                                    | OWNER, MANAGER              |
| PUT    | `/api/v1/canteens/:canteenId/menu/items/:itemId` | Updates a specific menu item.                               | OWNER, MANAGER              |
| DELETE | `/api/v1/canteens/:canteenId/menu/items/:itemId` | Deletes a specific menu item.                               | OWNER, MANAGER              |
| PATCH  | `/api/v1/canteens/:canteenId/menu/items/:itemId/availability` | Toggles availability of a menu item.                        | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/menu/items/:itemId/customizations` | Creates a new customization group for a menu item.          | OWNER, MANAGER              |
| PUT    | `/api/v1/canteens/:canteenId/menu/items/:itemId/customizations/:custId` | Updates a customization group.                              | OWNER, MANAGER              |
| DELETE | `/api/v1/canteens/:canteenId/menu/items/:itemId/customizations/:custId` | Deletes a customization group.                              | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/menu/items/:itemId/customizations/:custId/options` | Adds an option to a customization group.                    | OWNER, MANAGER              |
| PUT    | `/api/v1/canteens/:canteenId/menu/items/:itemId/customizations/:custId/options/:optId` | Updates a customization option.                             | OWNER, MANAGER              |
| DELETE | `/api/v1/canteens/:canteenId/menu/items/:itemId/customizations/:custId/options/:optId` | Deletes a customization option.                             | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/orders`          | Places a new order.                                         | CONSUMER                    |
| GET    | `/api/v1/canteens/:canteenId/orders/active`   | Lists active orders for a canteen.                          | KITCHEN, COUNTER, MANAGER, OWNER |
| GET    | `/api/v1/canteens/:canteenId/orders/history`  | Lists order history for a canteen.                          | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/orders/:orderId` | Retrieves details for a specific order.                     | Authenticated (consumer can view their own orders; staff/owner can view any canteen order) |
| POST   | `/api/v1/canteens/:canteenId/orders/:orderId/cancel` | Cancels an order.                                           | CONSUMER                    |
| PATCH  | `/api/v1/canteens/:canteenId/orders/:orderId/status` | Updates the status of an order.                             | KITCHEN, COUNTER, MANAGER, OWNER |
| POST   | `/api/v1/canteens/:canteenId/orders/:orderId/collect-cash` | Records cash payment for an order, handles change.          | OWNER, MANAGER, COUNTER     |
| GET    | `/api/v1/consumer/wallet`                     | Retrieves authenticated consumer's wallet balance.          | CONSUMER                    |
| GET    | `/api/v1/consumer/wallet/transactions`        | Lists authenticated consumer's wallet transactions.         | CONSUMER                    |
| POST   | `/api/v1/consumer/wallet/recharge-request`    | Submits a wallet recharge request.                          | CONSUMER                    |
| GET    | `/api/v1/canteens/:canteenId/wallet/requests` | Lists pending wallet recharge requests for a canteen.       | OWNER, MANAGER              |
| PATCH  | `/api/v1/canteens/:canteenId/wallet/requests/:reqId` | Approves or rejects a wallet recharge request.              | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/wallet/credit`   | Manually credits a consumer's wallet.                       | OWNER, MANAGER, COUNTER     |
| GET    | `/api/v1/canteens/:canteenId/consumers`       | Lists consumers who have ordered from a canteen.            | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/analytics/summary` | Retrieves summary analytics for a canteen.                  | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/analytics/revenue` | Retrieves daily revenue data for a canteen.                 | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/analytics/popular-items` | Retrieves popular menu items for a canteen.                 | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/analytics/peak-hours` | Retrieves peak ordering hours for a canteen.                | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/analytics/category-revenue` | Retrieves revenue by category for a canteen.                | OWNER, MANAGER              |
| POST   | `/api/v1/canteens/:canteenId/announcements`   | Creates a new announcement for a canteen.                   | OWNER, MANAGER              |
| GET    | `/api/v1/canteens/:canteenId/announcements`   | Lists announcements for a canteen.                          | OWNER, MANAGER              |
| PUT    | `/api/v1/canteens/:canteenId/announcements/:announcementId` | Updates an announcement.                                    | OWNER, MANAGER              |
| DELETE | `/api/v1/canteens/:canteenId/announcements/:announcementId` | Deletes an announcement.                                    | OWNER, MANAGER              |
| GET    | `/api/v1/consumer/orders`                     | Lists authenticated consumer's orders.                      | CONSUMER                    |
| GET    | `/api/v1/admin/owners`                        | Lists all registered owners.                                | SUPER\_ADMIN\_ONLY            |
| PATCH  | `/api/v1/admin/owners/:id/verify`             | Toggles an owner's verification status.                     | SUPER\_ADMIN\_ONLY            |
| GET    | `/api/v1/admin/stats`                         | Retrieves system-wide statistics.                           | SUPER\_ADMIN\_ONLY            |

**Next.js API Routes (`apps/web/src/app/api/`)**

| Method | Path                                          | Description                                             | Auth Required |
| :----- | :-------------------------------------------- | :------------------------------------------------------ | :------------ |
| GET    | `/api/health`                                 | Checks Next.js API server health.                       | No            |
| POST   | `/api/v1/upload`                              | Uploads an image to Cloudinary.                         | OWNER, MANAGER |
| GET    | `/api/v1/canteens`                            | Lists canteens owned by authenticated user.             | OWNER         |
| POST   | `/api/v1/canteens`                            | Creates a new canteen.                                  | OWNER         |
| POST   | `/api/v1/public/identify`                     | Identifies or creates a consumer.                       | No            |
| GET    | `/api/v1/consumer/wallet`                     | Retrieves authenticated consumer's wallet.              | CONSUMER      |
| POST   | `/api/v1/consumer/push-token`                 | Registers a device push token for a consumer.           | CONSUMER      |
| DELETE | `/api/v1/consumer/push-token`                 | Removes a device push token for a consumer.             | CONSUMER      |
| GET    | `/api/v1/consumer/orders`                     | Lists authenticated consumer's orders.                  | CONSUMER      |
| GET    | `/api/v1/canteens/[id]`                       | Retrieves a single canteen.                             | OWNER         |
| PUT    | `/api/v1/canteens/[id]`                       | Updates a canteen.                                      | OWNER         |
| DELETE | `/api/v1/canteens/[id]`                       | Deletes a canteen.                                      | OWNER         |
| GET    | `/api/v1/admin/stats`                         | Retrieves system-wide stats.                            | SUPER\_ADMIN\_ONLY |
| GET    | `/api/v1/admin/owners`                        | Lists all owners.                                       | SUPER\_ADMIN\_ONLY |
| POST   | `/api/v1/auth/refresh`                        | Refreshes access token.                                 | No            |
| GET    | `/api/v1/public/track/[trackingToken]`        | Tracks an order.                                        | No            |
| GET    | `/api/v1/public/resolve-qr/[qrToken]`         | Resolves QR code.                                       | No            |
| GET    | `/api/v1/consumer/wallet/transactions`        | Lists consumer wallet transactions.                     | CONSUMER      |
| POST   | `/api/v1/consumer/wallet/recharge-request`    | Submits wallet recharge request.                        | CONSUMER      |
| GET    | `/api/v1/canteens/[id]/tables`                | Lists tables for a canteen.                             | OWNER, MANAGER |
| POST   | `/api/v1/canteens/[id]/tables`                | Creates a table for a canteen.                          | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/staff`                 | Lists staff for a canteen.                              | OWNER, MANAGER |
| POST   | `/api/v1/canteens/[id]/staff`                 | Creates staff for a canteen.                            | OWNER, MANAGER |
| POST   | `/api/v1/canteens/[id]/orders`                | Places a new order.                                     | CONSUMER      |
| GET    | `/api/v1/canteens/[id]/menu`                  | Retrieves a canteen's full menu.                        | No            |
| GET    | `/api/v1/canteens/[id]/consumers`             | Lists consumers for a canteen.                          | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/categories`            | Lists categories for a canteen.                         | OWNER, MANAGER |
| POST   | `/api/v1/canteens/[id]/categories`            | Creates a category for a canteen.                       | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/announcements`         | Lists announcements for a canteen.                      | OWNER, MANAGER |
| POST   | `/api/v1/canteens/[id]/announcements`         | Creates an announcement for a canteen.                  | OWNER, MANAGER |
| POST   | `/api/v1/auth/staff/login`                    | Authenticates staff.                                    | No            |
| POST   | `/api/v1/auth/owner/register`                 | Registers owner.                                        | No            |
| POST   | `/api/v1/auth/owner/login`                    | Authenticates owner.                                    | No            |
| GET    | `/api/v1/public/canteen/[slug]/menu`          | Retrieves public menu for a slug.                       | No            |
| POST   | `/api/v1/canteens/[id]/tables/bulk-qr`        | Bulk QR generation.                                     | OWNER, MANAGER |
| PUT    | `/api/v1/canteens/[id]/tables/[tableId]`      | Updates a table.                                        | OWNER, MANAGER |
| DELETE | `/api/v1/canteens/[id]/tables/[tableId]`      | Deletes a table.                                        | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/wallet/requests`       | Lists wallet recharge requests.                         | OWNER, MANAGER |
| POST   | `/api/v1/canteens/[id]/wallet/credit`         | Manually credits wallet.                                | OWNER, MANAGER |
| PATCH  | `/api/v1/canteens/[id]/staff/[staffId]`       | Updates staff.                                          | OWNER, MANAGER |
| DELETE | `/api/v1/canteens/[id]/staff/[staffId]`       | Deletes staff.                                          | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/orders/history`        | Lists order history.                                    | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/orders/active`         | Lists active orders.                                    | KITCHEN, COUNTER, MANAGER, OWNER |
| GET    | `/api/v1/canteens/[id]/orders/[orderId]`      | Retrieves order details.                                | Authenticated |
| POST   | `/api/v1/canteens/[id]/menu/items`            | Creates menu item.                                      | OWNER, MANAGER |
| PUT    | `/api/v1/canteens/[id]/categories/[catId]`    | Updates category.                                       | OWNER, MANAGER |
| DELETE | `/api/v1/canteens/[id]/categories/[catId]`    | Deletes category.                                       | OWNER, MANAGER |
| PUT    | `/api/v1/canteens/[id]/announcements/[annId]` | Updates announcement.                                   | OWNER, MANAGER |
| DELETE | `/api/v1/canteens/[id]/announcements/[annId]` | Deletes announcement.                                   | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/analytics/summary`     | Retrieves analytics summary.                            | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/analytics/detailed`    | Retrieves detailed analytics.                           | OWNER, MANAGER |
| PATCH  | `/api/v1/admin/owners/[ownerId]/verify`       | Toggles owner verification.                             | SUPER\_ADMIN\_ONLY |
| GET    | `/api/v1/canteens/[id]/tables/[tableId]/qr`   | Generates QR for a table.                               | OWNER, MANAGER |
| PATCH  | `/api/v1/canteens/[id]/wallet/requests/[reqId]` | Handles recharge request.                               | OWNER, MANAGER |
| PATCH  | `/api/v1/canteens/[id]/orders/[orderId]/status` | Updates order status.                                   | KITCHEN, COUNTER, MANAGER, OWNER |
| POST   | `/api/v1/canteens/[id]/orders/[orderId]/collect-cash` | Collects cash payment.                                  | OWNER, MANAGER, COUNTER |
| POST   | `/api/v1/canteens/[id]/orders/[orderId]/cancel` | Cancels order.                                          | CONSUMER      |
| PUT    | `/api/v1/canteens/[id]/menu/items/[itemId]`   | Updates menu item.                                      | OWNER, MANAGER |
| DELETE | `/api/v1/canteens/[id]/menu/items/[itemId]`   | Deletes menu item.                                      | OWNER, MANAGER |
| GET    | `/api/v1/canteens/[id]/menu/items/[itemId]/customizations` | Lists item customizations.                              | OWNER, MANAGER |
| POST   | `/api/v1/canteens/[id]/menu/items/[itemId]/customizations` | Creates item customization.                             | OWNER, MANAGER |
| PATCH  | `/api/v1/canteens/[id]/menu/items/[itemId]/availability` | Toggles item availability.                              | OWNER, MANAGER, KITCHEN |
| PUT    | `/api/v1/canteens/[id]/menu/items/[itemId]/customizations/[custId]` | Updates customization.                                  | OWNER, MANAGER |
| DELETE | `/api/v1/canteens/[id]/menu/items/[itemId]/customizations/[custId]` | Deletes customization.                                  | OWNER, MANAGER |

---