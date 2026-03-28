# Swift Shop — Master Frontend Prompt

Use this prompt in full when building the frontend. Do not skip any section. Every detail here is intentional.

---

## What You Are Building

A one-page e-commerce storefront called Swift Shop. It is a minimal, fast, and visually distinctive online shop where customers browse products, place orders, and track their deliveries in real time. The client does not handle delivery. All orders are automatically forwarded to the nearest courier company based on the customer's location. The client watches everything from a separate admin panel.

The entire customer-facing experience lives on one scrollable page. No page reloads. No clutter. No generic AI-looking design.

---

## Tech Stack

- Framework: Next.js 14 with the App Router
- Language: TypeScript throughout, strict mode on
- Styling: Tailwind CSS only, no separate CSS files
- State: Zustand for cart, wishlist, and session
- Maps: Galli Maps JavaScript SDK for address pin drop
- Backend: Supabase (Postgres, Realtime, Storage, Auth, Edge Functions)
- Geo queries: PostGIS extension on Supabase
- Search: Supabase full-text search with pg_trgm
- Email: Resend via Supabase Edge Functions
- Spam protection: hCaptcha free tier on checkout
- Deployment: Netlify

---

## Design Direction

This is the most important section. Read it carefully before writing a single line of code.

The design must feel like it was crafted by a thoughtful human designer, not generated. Avoid every generic pattern: no purple gradients, no Inter or Roboto fonts, no rounded-everything card grids, no hero sections with centered text on a gradient blob.

The aesthetic is refined utilitarian. Think a well-run local market that took design seriously. Warm off-white backgrounds. Deep ink-black type. One strong accent color (a burnt sienna or deep terracotta, not red, not orange, something between). Generous whitespace. Slightly asymmetric layouts. Products laid out like editorial spreads, not Amazon listings.

Typography: pair a high-contrast serif display font (Playfair Display, Cormorant Garamond, or DM Serif Display) for headings with a clean humanist sans-serif (DM Sans, Plus Jakarta Sans, or Sora) for body text and UI. Never use Inter, Roboto, or Arial.

Colors:
- Background: #F7F3EE (warm off-white, never pure white)
- Ink: #1A1714 (near black with a warm undertone)
- Accent: #B5451B (burnt sienna, used sparingly for CTAs, active states, and highlights)
- Muted: #8C8680 (for secondary text and disabled states)
- Surface: #EDE9E2 (for cards and input backgrounds)
- Border: #D6D1CA (subtle rule color)
- Success: #2D7A4F
- Error: #C0392B

Motion: one staggered reveal on page load where sections fade and slide up with 80ms delay increments. Hover states on product cards lift with a subtle shadow and a 200ms ease. The cart icon bounces once when an item is added. Nothing else animates unless it communicates something meaningful.

Custom cursor: a small filled circle that follows the mouse, 10px diameter, accent color, replaces the default cursor on desktop only.

No emojis anywhere in the UI. Use SVG icons from Lucide React for all iconography.

---

## Page Structure

The page is one vertical scroll. Each section is a full-width block. Sections in order:

1. Sticky Header
2. Hero
3. Category Bar
4. Product Grid
5. Live Order Feed Strip
6. Checkout Section
7. Order Tracking Section
8. Footer

Smooth scroll behavior is on. Clicking navigation links scrolls to the section with a 60px offset for the sticky header.

---

## Section 1: Sticky Header

Position: fixed to top, full width, z-index 50.
Background: #F7F3EE with a 1px bottom border in #D6D1CA. Slight backdrop blur.
Height: 64px desktop, 56px mobile.

Left side: Shop logo or name in the display serif font, 20px, ink color.

Center (desktop only): Search bar. Full width up to 400px. Input background #EDE9E2. No border, subtle inner shadow. Placeholder text: "Search products...". Debounced 300ms. Results appear as a dropdown below the input. Each result shows product image thumbnail (32x32), product name, and category. Clicking a result scrolls to that product and opens its detail view. If no results, show "No products found for this search."

Right side: Wishlist icon with count badge, Cart icon with count badge, and on mobile a hamburger that opens a bottom sheet with the search bar.

The cart badge and wishlist badge use the accent color. Counts update in real time via Zustand.

---

## Section 2: Hero

Full viewport height on desktop, 70vh on mobile.
Background: #1A1714 (dark).

Left side (60% width on desktop, full width on mobile): 
- Small label above the heading: "Free delivery to your door" in 12px uppercase tracking-widest accent color.
- Main heading in the display serif, 64px desktop / 36px mobile, white, line height 1.1. The heading should feel editorial, not salesy.
- Subheading in the humanist sans, 16px, muted warm gray, max 2 lines.
- Two buttons: primary "Shop Now" in accent color with white text, secondary "Track Order" as a ghost button with white border.

Right side (40% width desktop): A product image collage. Three overlapping product images at slightly different rotations (2 to 5 degrees). No explicit image provided, so use a placeholder that accepts a dynamic image URL. On mobile this collapses and sits below the text.

The staggered entrance animation starts here: the label fades in first, then the heading, then the subheading, then the buttons, each 80ms apart.

---

## Section 3: Category Bar

Sticky below the header when scrolled past the hero. Background matches the page (#F7F3EE). 1px border bottom.
Height: 52px.

Horizontally scrollable row of category pills. Each pill: 
- Background #EDE9E2 when inactive.
- Background accent color with white text when active.
- Font: humanist sans, 13px, medium weight.
- 12px horizontal padding, 6px vertical padding, 6px border radius.
- Smooth color transition 150ms.

First pill is always "All" and is active by default.

Categories are fetched from Supabase on load. Clicking a category filters the product grid below in real time with no reload. The URL updates with a query parameter so filtered views are shareable.

On mobile: hide scrollbar but keep horizontal scroll. Show a subtle fade gradient on the right edge to indicate more pills exist.

---

## Section 4: Product Grid

Padding: 48px vertical, standard horizontal page margin.
Heading row: left-aligned section label "Products" in 11px uppercase tracking-widest muted color, and the active category name in the display serif at 28px next to it.

Grid layout: 3 columns desktop, 2 columns tablet, 1 column mobile. Gap 24px.

Each product card:
- No heavy border radius. Maximum 8px.
- Background: white (#FFFFFF) with a very subtle 1px border #D6D1CA.
- No drop shadow by default. On hover: translateY(-4px) and box-shadow 0 8px 24px rgba(26,23,20,0.10). Transition 200ms ease.
- Image: 100% width, 3:4 aspect ratio, object-fit cover. If out of stock, a thin "Out of Stock" ribbon in the top left corner, dark background, white text, 11px.
- Below image: 16px padding.
- Category name: 10px, uppercase, tracking-wide, muted color.
- Product name: 15px, medium weight, humanist sans, ink color, 2 lines max then truncate.
- Price row: regular price in 16px semibold ink. If sale price exists, show sale price in accent color and regular price struck through in muted 13px next to it.
- Below the price: a row with a wishlist heart icon on the left and an "Add to Cart" button on the right. The button is small: 32px height, accent color background, white text, 9px font, 12px horizontal padding.
- Stock indicator: a small dot and text below the price. Green dot for In Stock, amber for Low Stock (under 5 units), red for Out of Stock.

Clicking anywhere on the card except the wishlist and cart buttons opens the product detail panel.

Product detail panel: slides in from the right as a drawer. Width 480px on desktop, full screen on mobile. Overlay behind it is a semi-transparent dark layer. The drawer contains:
- Image gallery: main image large, thumbnails below in a horizontal row. Clicking a thumbnail swaps the main image.
- Product name in display serif 26px.
- Rating row: filled stars, average score, and review count as a link that scrolls to reviews.
- Price (same sale price logic as the card).
- Size selector: row of pill buttons for each size. Selected size gets accent background. If a size is out of stock, it is shown with a line through it and is not selectable.
- Quantity selector: minus button, number, plus button. Bounded by available stock.
- Add to Cart button: full width, accent color, 48px height.
- Buy Now button: full width, dark background, white text, 48px height. Adds to cart and immediately scrolls to checkout.
- Description section with full product text.
- Reviews section: star average large, total count, list of reviews each showing customer name (first name only), star rating, comment, and date. Reviews are paginated 5 at a time with a Load More button.
- Related products: a horizontal scroll row of 4 products from the same category.

Closing the drawer: clicking the overlay or an X button.

---

## Section 5: Live Order Feed Strip

A full-width strip with a dark background (#1A1714). Height 44px. Overflow hidden.

Inside: a horizontally scrolling ticker that moves right to left continuously at a slow pace (40 seconds for one full loop). The ticker shows recent orders from Supabase Realtime in the format:

"[First Name] ordered [Product Name] ([Size]) — [X] min ago"

Separator between entries: a small accent-colored dot.
Font: humanist sans, 13px, white text, muted gray for the time part.

The ticker pauses on hover. New entries are prepended as they arrive via the Supabase Realtime subscription. Maximum 10 entries shown at once, oldest removed when new one arrives.

There is a small label on the left edge of the strip, outside the scroll area: "Live Orders" in 10px uppercase white.

If the admin has turned off the live feed, this entire strip is hidden.

---

## Section 6: Checkout Section

Section ID: checkout. Background: #EDE9E2. Padding 64px vertical.

Two-column layout on desktop (50/50), single column on mobile.

Left column: Order summary.
- Heading "Your Order" in display serif 24px.
- List of cart items. Each item: thumbnail 56x56, name, size, quantity controls (minus/number/plus), line price, remove button. If cart is empty show a friendly empty state with a button to go back to products.
- Subtotal row.
- Promo code input with an Apply button. If code is valid, show discount line. If invalid, show inline error.
- Total row in larger text.

Right column: Customer details form.
- Heading "Delivery Details" in display serif 24px.
- All fields use the same style: label above the input, 13px medium, ink color. Input background white, 1px border #D6D1CA, 8px border radius, 44px height. Focus state: accent color border. Error state: error color border with a small error message below.

Fields in order:
1. Full Name (text, required)
2. Phone Number (tel, required, Nepal format, starts with 98 or 97)
3. Email Address (email, required)
4. Province (select dropdown, lists all 7 provinces of Nepal in order)
5. District (select dropdown, populates based on selected province, lists all districts for that province)
6. Area / Tole / Street (text, required)
7. Landmark (text, optional, placeholder "Nearby landmark to help courier find you")
8. Map Pin Drop (Galli Maps embed, 280px height, customer drops a pin to confirm exact location, lat/lng stored silently, address field auto-fills from pin if customer prefers)
9. Payment Method (radio buttons styled as selectable cards: Cash on Delivery, eSewa, Khalti)
10. Order Notes (textarea, optional, placeholder "Any special instructions for the courier")

Below the map, a small coverage indicator: if the dropped pin is within a courier's service area show a green checkmark and "Delivery available to your area." If not, show a red warning "Delivery is not available to your area yet." This check fires on pin drop via a lightweight Supabase query.

hCaptcha widget placed above the Place Order button.

Place Order button: full width, 52px height, accent color, display serif font 17px. Shows a loading spinner while submitting. On success, replaces the form with a confirmation message showing the order number and a link to track the order.

All Nepal provinces and districts for the dropdowns:

Province 1 Koshi: Taplejung, Panchthar, Ilam, Jhapa, Morang, Sunsari, Dhankuta, Terhathum, Sankhuwasabha, Bhojpur, Solukhumbu, Okhaldhunga, Khotang, Udayapur

Province 2 Madhesh: Saptari, Siraha, Dhanusha, Mahottari, Sarlahi, Rautahat, Bara, Parsa

Province 3 Bagmati: Dolakha, Sindhupalchok, Rasuwa, Nuwakot, Dhading, Makwanpur, Chitwan, Kavrepalanchok, Sindhuli, Ramechhap, Kathmandu, Bhaktapur, Lalitpur

Province 4 Gandaki: Gorkha, Manang, Mustang, Myagdi, Kaski, Lamjung, Tanahu, Nawalpur, Syangja, Parbat, Baglung

Province 5 Lumbini: Rukum East, Rolpa, Pyuthan, Gulmi, Arghakhanchi, Palpa, Nawalparasi East, Rupandehi, Kapilvastu, Dang, Banke, Bardiya

Province 6 Karnali: Dolpa, Mugu, Humla, Jumla, Kalikot, Dailekh, Jajarkot, Rukum West, Salyan, Surkhet

Province 7 Sudurpashchim: Bajura, Bajhang, Darchula, Baitadi, Dadeldhura, Doti, Achham, Kailali, Kanchanpur

---

## Section 7: Order Tracking Section

Section ID: tracking. Background: #F7F3EE. Padding 64px vertical.

Centered layout, max width 600px.

Heading in display serif 32px: "Track Your Order"
Subheading in humanist sans 15px muted: "Enter your phone number or order ID to see your delivery status."

Input row: large text input (phone or order ID) with a Search button beside it. On submit, queries Supabase for the matching order.

If order found, show:
- Order number and date in small text.
- Courier company name assigned to the order.
- A vertical timeline. Each milestone is a row: a circle icon on the left (filled in accent color if reached, outlined and muted if not yet), a status label, and a timestamp. Milestones in order: Order Placed, Order Confirmed, Picked Up, On the Way, Delivered.
- The active milestone circle pulses gently with a CSS animation.
- If the order has a failed delivery attempt, show a red milestone entry.

If no order found, show "No order found with that phone number or order ID."

---

## Section 8: Footer

Background: #1A1714. Padding 48px vertical.

Three columns on desktop, stacked on mobile.

Column 1: Shop name in display serif 22px white. Short description 13px warm gray, max 2 lines. Social media icons (Instagram, Facebook, TikTok) as small SVG icon buttons, white, with hover accent color.

Column 2: Quick links. Heading "Shop" 13px uppercase tracking-wide muted gray. Links: All Products, Categories, Track Order, Contact Us. Each link 13px white, hover accent color underline.

Column 3: Delivery areas. Heading "We Deliver To" 13px uppercase tracking-wide muted gray. A list of province names in 13px warm gray, pulled from the active couriers in Supabase.

Bottom row: 1px border top #2E2A27. Copyright text left, "Built with care in Nepal" right. Both 11px muted gray.

---

## Supabase Integration Points

Connect all components to Supabase using the official Supabase JS client. Use environment variables for the URL and anon key. Never expose the service role key on the frontend.

Products: fetch from the products table joined to categories. Filter by category_id when a category pill is active. Use Supabase full-text search with pg_trgm for the search bar.

Cart: Zustand store, persisted to localStorage. Sync to a carts table row keyed by a session UUID stored in localStorage.

Wishlist: Zustand store persisted to localStorage. Sync to the wishlists table with the same session UUID.

Checkout form: on submit, insert a row to the orders table. The lat and lng from the Galli Maps pin drop are stored as separate float columns. The province and district from the dropdowns are stored as text columns. The Edge Function handles courier assignment and forwarding after the insert.

Order tracking: query orders table by phone or id. Subscribe to order_events for that order_id using Supabase Realtime channel so status updates arrive live without a refresh.

Live feed: subscribe to a Supabase Realtime channel on a sanitized view of the orders table that exposes only customer_first_name, product_name, size, and created_at. No personal data.

Reviews: fetch from reviews table by product_id, ordered by created_at descending. Reviews can only be submitted if the customer's phone number matches an order that includes that product and has status delivered.

---

## Admin Panel

The admin panel lives at the route /admin. It is completely separate from the storefront. Protect every /admin route with Supabase Auth. Only users with the admin role in user_metadata can access it. Redirect anyone else to the homepage.

The admin panel has its own layout: a fixed left sidebar 240px wide on desktop, a top bar with the admin's name and a logout button, and a main content area.

Sidebar navigation links: Dashboard, Products, Categories, Orders, Couriers, Promo Codes, Analytics, Settings. Each link is 14px, has an icon from Lucide React, and highlights with accent color when active.

The admin panel uses the same color system as the storefront but with a slightly cooler background (#F4F2EF) to visually distinguish it.

Dashboard page:
- Four stat cards in a row: Today's Orders, Today's Revenue, Pending Dispatches, Held Orders. Each card shows the number large in display serif, a label below, and a trend indicator.
- Below: a live orders table showing the most recent 20 orders, auto-updating via Supabase Realtime.

Products page:
- Table of all products with image thumbnail, name, category, price, stock, and status.
- Add Product button opens a right drawer form with all product fields. Image upload goes to Supabase Storage. Multiple images supported, drag to reorder.
- Row actions: Edit (opens same drawer prefilled), Toggle Active, Delete (with confirmation).

Categories page:
- List of categories with drag-to-reorder. Each row shows the category name, product count, and a toggle.
- Add Category button opens a small inline form.

Orders page:
- Full table of all orders with filters by status and date range.
- Each row: order ID, customer name, items summary, total, courier assigned, current status, created time.
- Clicking a row opens a detail drawer with the full order and a status update selector. Admin can manually move the status forward.
- A Re-dispatch button re-triggers the Edge Function for orders stuck in held or failed state.

Couriers page:
- Cards for each courier company showing name, coverage radius, active status, and a Galli Maps embed showing their coverage circle.
- Add Courier form: name, API endpoint, API key (masked field), headquarters location via map pin, coverage radius in km, priority number.
- Toggle to activate or deactivate each courier.

Promo Codes page:
- Table of all codes with code string, type, value, usage count versus limit, expiry date, and active toggle.
- Add Code form: code string, type (percent or flat), value, minimum order amount, usage limit, expiry date.

Analytics page:
- Line chart of orders per day for the last 30 days.
- Bar chart of top 10 products by order count.
- Revenue total for current month.
- Export to CSV button that downloads the orders table filtered by the selected date range.

Settings page:
- Form fields: Shop Name, Shop Tagline, Logo upload, Contact Email, Contact Phone, Instagram URL, Facebook URL, TikTok URL.
- Live Feed toggle (shows or hides the order ticker strip on the storefront).
- Save button with success toast on save.

---

## Components to Build

Build these as reusable components in the /components directory:

- ProductCard: grid card with hover state
- ProductDrawer: full product detail slide-in panel
- CartDrawer: slide-in cart from the right
- CheckoutForm: the full checkout section form
- AddressForm: province, district, area, landmark, and map pin fields as a self-contained component
- GalliMap: wrapper around the Galli Maps SDK with pin drop callback
- OrderTimeline: vertical status timeline for tracking
- LiveFeedTicker: the horizontally scrolling order feed
- CategoryBar: sticky scrollable category pills
- SearchBar: input with dropdown results
- ReviewsList: paginated review list with Load More
- AdminTable: reusable sortable table for the admin panel
- AdminDrawer: reusable right-side form drawer for admin CRUD
- StatCard: dashboard stat card with number and trend
- CourierCard: courier info card with map embed
- Toast: success and error toast notifications, top-right position

---

## Responsive Rules

Mobile breakpoint: 640px and below.
Tablet breakpoint: 641px to 1024px.
Desktop: 1025px and above.

On mobile:
- Header collapses search into a bottom sheet triggered by a search icon
- Hero is single column, image below text
- Category bar scrolls horizontally
- Product grid is 1 column
- Product drawer is full screen
- Checkout is single column
- Admin sidebar collapses into a hamburger bottom sheet

---

## Accessibility

Every interactive element has a visible focus state using the accent color outline.
All images have descriptive alt text.
Form fields are associated with labels using htmlFor and id.
Color contrast meets WCAG AA for all text.
The cart count badge has an aria-label.
Modal and drawer overlays trap focus and close on Escape key.

---

## Performance

Images are served via Next.js Image component with lazy loading and automatic WebP conversion.
Product images in Supabase Storage use transformation URLs for auto-resize.
The Supabase client is initialized once and shared via a singleton.
The Galli Maps SDK loads only when the checkout section is in the viewport, using an IntersectionObserver.
Cart and wishlist state is hydrated from localStorage only on the client to avoid hydration mismatch.
All Supabase Realtime subscriptions are cleaned up on component unmount.

---

## Error States

Every data fetch has a loading skeleton and an error fallback.
If Supabase is unreachable, show a banner at the top of the page: "We are having trouble loading the shop. Please try again in a moment."
If the checkout form submission fails, show an inline error above the Place Order button with the reason.
If the coverage check fails silently, allow the order to proceed and flag it in the admin panel.
If an image fails to load, show a placeholder with the product initial in the accent color.

---

## What Not to Do

Do not use Inter, Roboto, or Arial as fonts.
Do not use purple, blue, or teal as the primary accent color.
Do not use generic card designs with heavy rounded corners and drop shadows everywhere.
Do not center-align body text or product descriptions.
Do not add animations to every element. Motion is earned.
Do not show raw error messages from Supabase to the customer.
Do not store the service role key in the frontend code or environment.
Do not use any placeholder lorem ipsum text in the final build.
Do not use emojis anywhere in the UI.
Do not paginate the storefront with page numbers. Use a Load More button or infinite scroll.
