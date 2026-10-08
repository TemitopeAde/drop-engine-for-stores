# Exact Wix permission scopes

Status: documentation-verified proposed scope set, not applied to the remote app. Scope IDs below are the exact Dev Center IDs reported by Wix MCP; they are not lower-level API action names. This list covers the proposed read-only-catalog foundation and order analytics; later selected integrations may need additional verified scopes.

| Permission label | Exact scope ID | Feature | Official documentation |
| --- | --- | --- | --- |
| Manage Your App | `SCOPE.DC.MANAGE-YOUR-APP` | Installation/site identity, current billing entitlements, install/remove/plan events, site timezone | [Get App Instance](https://dev.wix.com/docs/api-reference/app-management/app-instance/get-app-instance?apiView=SDK), [Site Properties](https://dev.wix.com/docs/api-reference/business-management/site-properties/properties/read?apiView=SDK) |
| Read v3 catalog (PII) | `SCOPE.STORES.CATALOG_READ_LIMITED` | Detect V1/V3/Stores-not-installed | [Get Catalog Version](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/get-catalog-version?apiView=SDK) |
| Read Products | `SCOPE.DC-STORES.READ-PRODUCTS` | V1 visible product picker, variants, inventory, product updates | [Query Variants](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-product-variants?apiView=SDK), [Inventory](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/inventory/query-inventory?apiView=SDK) |
| Read products in v3 catalog | `SCOPE.STORES.PRODUCT_READ` | V3 visible product picker/details and product events | [Query Products](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/query-products?apiView=SDK) |
| Read inventory in v3 catalog | `SCOPE.STORES.INVENTORY_ITEM_READ` | V3 actual variant/location inventory | [Get Inventory Item](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/inventory-items-v3/get-inventory-item?apiView=SDK) |
| Read Data Items | `SCOPE.DC-DATA.READ` | Tenant-bound app data, active gate reads, waitlist counts, reports | [Query Data Items](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/query-data-items?apiView=SDK) |
| Write Data Items | `SCOPE.DC-DATA.WRITE` | Drop lifecycle, consented subscriptions, jobs, delivery/event records, audit | [Update Data Item](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/update-data-item?apiView=SDK), [Insert](https://dev.wix.com/docs/sdk/business-solutions/data/items/insert) |
| Read Orders | `SCOPE.DC-STORES.READ-ORDERS` | Buyer purchase records, order reconciliation, payment/refund transaction events, sales/conversion | [Order Created](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/orders/orders/order-created?apiView=SDK), [Transactions Updated](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/orders/order-transactions/order-transactions-updated?apiView=SDK) |

Add Read Orders when order-driven features ship; it is unnecessary for prelaunch time gating by itself. Both catalog read scopes are necessary to support both site catalog versions. Despite its label, the catalog-version scope is explicitly required by the versioning method. Do not silently replace it with a guessed scope.

No additional callback-specific scope was listed by the retrieved Validations method/configuration. Its registration plus the Data permissions for implementation reads are the verified requirements so far. Confirm any additional Dev Center/runtime requirement during release testing instead of guessing a mega eCommerce scope.

## Conditional permissions — not requested by default

| Exact scope ID | Only add when | Source / rationale |
| --- | --- | --- |
| `SCOPE.DC-STORES.MANAGE-PRODUCTS` | Verified and approved V1 promotional catalog price writes, or an explicitly approved hidden-product query | [V1 Update Product](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/update-product); hidden/merchant-specific query flags require manage privileges |
| `SCOPE.STORES.PRODUCT_WRITE` | Verified and approved V3 promotional catalog price writes | [V3 Update Product](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/update-product) |
| `SCOPE.STORES.PRODUCT_READ_ADMIN` | An approved requirement to read V3 hidden products or merchant financial data | [V3 Query Products](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/query-products?apiView=SDK); proposed MVP only accepts visible products and does not need cost/profit fields |
| `SCOPE.DC-DATA.DATA-COLLECTIONS-MANAGE` | An approved runtime collection management/capability inspection operation that genuinely needs it | [Get Data Collection](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/get-data-collection?apiView=SDK); install-time declarative provisioning does not itself justify runtime management scope |

Inventory writes, site-owner email, contact management, standalone payments refund read, members management and external billing are not part of the proposed base scope set. Membership identification or an approved email integration may require additional scopes only after their exact API contracts are verified. Do not add contact-read just because a purchase already contains a contact ID.

## Manual application and release verification

Open [this app's Dev Center](https://manage.wix.com/apps/8d450f0a-51d0-44d1-9f99-8fca22fe3a03/home), choose Develop → Permissions → Add Permissions, and apply only scopes for shipped features. Already-installed sites must approve the updated permissions through the documented install/update flow before these scopes work. Bundle CMS/Stores as app dependencies, separately from scopes.

After installation, verify current granted scope data through Get App Instance and exercise each feature under its intended identity. Dashboard authentication is not a substitute for authorization and backend elevation is not a substitute for tenant isolation. Permission setup alone does not certify checkout, membership, pricing, or uninstall behavior.
