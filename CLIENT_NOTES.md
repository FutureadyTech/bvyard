# BV Yard — Notes for Client Review

Built from the meeting recording transcribed on 21 May 2026. This document flags every assumption I made (some audio sections were unclear) so you can correct anything off.

---

## What's in this v0.2 prototype

### Demand-fulfilment % tracking
- Every demand item now stores `demandedQty` + `fulfilledQty`.
- When an Issue Voucher is created **and linked to a demand**, the system auto-decrements the pending qty and recomputes the demand's qty-% and item-%.
- Demand status auto-flows: `pending` → `approved` (PO generated) → `partially_fulfilled` → `fulfilled`.
- Compliance % shown on Dashboard, Demands list, Reports.

### Section-wise inventory managers
- Six physical sections: Dry Store, Basic Store, Dal Store, Masala Store, Fresh Store, Meat Store.
- Each inventory manager is assigned one section and sees only their items.
- A "Central Coordinator" role (Cdr OICNG in our seed) sees everything but cannot create/modify — pure visibility.
- Super Admin and Reviewer see all sections.

### Multi-denomination units (pack × count)
- Each product has `baseUnit` (kg/Ltr/Nos) + `packSize` + `packUnit`.
- Example: Atta is stored as 10kg packets. Stock display shows "180 × 10kg pkt = 1800 kg".
- Stock-In form takes input as **packs + loose** and auto-calculates total.

### Code-view toggle (anonymization)
- Top-bar toggle "Code view" replaces all item names with their CNVICT codes.
- Use this when sharing screens with people who shouldn't know what's actually in inventory.

### Spoilage / Write-off
- New menu under "Phase 2 — Inward".
- Record stock loss with reason (spoilage / damage / expired / theft / misc).
- Reduces stock immediately so totals stay reconciled.

### Dispatch / Gate-out
- New menu under "Phase 3 — Outward".
- Records vehicle no, driver, gate-out time, gate-in time, destination.
- Links to the Issue Voucher.

### Reports
- Date-range filter (default: last 30 days).
- KPIs: demands processed, ships served, total outflow, avg compliance %.
- Top 10 items issued, ship-wise breakdown with compliance, daily activity bars, section flow (in vs out), spoilage summary.

### Smart PO generation
- "⚡ Smart PO from consumption" button on Purchase Orders page.
- Calculates avg daily consumption from last 30 days of issued stock.
- Suggests reorder qty (avg × 7 days, or min-stock × 2 — whichever bigger).
- Reviewer can override every line before generating the draft PO.

### Phased sidebar
- Reorganised to match the client's mental model: **Phase 1 Demand → Phase 2 Inward (+ Spoilage) → Phase 3 Outward (+ Dispatch) → Phase 4 Procurement → Insights → Admin**.

---

## Assumptions I made (please correct if wrong)

### From audio gaps in the transcript

1. **Section names + codes (NG/BG/DAL/MS/FG/MT)** — extracted from the user codes in the source documents (CNVICT-NGFD, CNVICT-BGRC, etc.). Used the prefix structure to derive section codes. **Confirm these match the official BVO terminology.**

2. **Inventory manager assignments** — I assigned seeded users to sections based on rank + designation hints in the docs (e.g. Raj K Panjiyara is "ICBG" = In-Charge Basic Group, so he's assigned the Dry Store). **Confirm real section assignments.**

3. **Spoilage reasons** — I picked spoilage / damage / expired / theft / misc as the default set. The meeting only mentioned "miscellaneous or something" generically. **Are these the right reasons to track?**

4. **8–10 vehicles/day max** — transcript said "minimum of 8 to 10… maximum day we will have keep them" — the actual max number was cut off. Assumed ~20 vehicle capacity. **What's the realistic max?**

5. **Demand cycle prediction** — meeting mentioned ships have predictable cycles ("one asks on 19th, another on 28th"). I did NOT build this yet — flagged as future work since the data structure isn't there yet. **Want me to build a "predicted next demand" view?**

6. **Vendor WhatsApp number** — added placeholder numbers to seeded suppliers. **Real numbers go in user testing.**

7. **3rd approval level (management visibility)** — I implemented this as the "Central Coordinator" role with read-only across all sections. Meeting said this layer should NOT block the issue process. Confirmed by the role's permission set (no `approve`, no `create`). **Is this what was intended, or did the 3rd level need its own active approval step?**

8. **Substitution UX** — meeting said "either substitute or part fulfillment". I built partial fulfilment fully. Substitution is supported in the data model (`substitutedFor` field) but not in the UI yet — the Issue Voucher form doesn't currently let you swap one product for another. **Want a substitute-item picker added?**

9. **Smart PO threshold** — set at 7-day consumption cover or min-stock × 2, whichever bigger. **Reasonable, or should the rule be different (e.g. lead-time-based)?**

10. **Item codes shown in Code view** — currently shows the full CNVICT-NGFDAM102 code. Some teams might prefer shorter codes (e.g. NG-A-102). **Should the code format be different for screens visible to outsiders?**

### Things deferred to Phase 2 (not built in this prototype)

- **OCR for Delivery Challan scanning** — placeholder button exists on Stock-In page, shows a "coming soon" toast.
- **Barcoding scanner-wall** — entire bay-based scan-in/scan-out model.
- **Real authentication** — currently just a mock role selector; production needs AD or hashed users.
- **Audit log** — every action should be loggable in production; currently no log.
- **Print-perfect IAFZ-2096 / IN-1050 layouts** — the View modals show all fields but don't match the exact paper-form layout pixel-for-pixel.
- **Mobile-responsive layout** — works on tablets but not optimised for phones.

---

## How to demo

1. **Open `index.html`** in any modern browser (Chrome, Edge, Firefox).
2. Pick a role to log in. The "Inventory Manager" option logs you in as the Dry Store manager — you'll see only Dry Store items.
3. **Try this end-to-end flow** to show the compliance loop:
   - As **Reviewer**: go to **Phase 1 Demand** → see pending demands → click "Approve → PO" on one of them.
   - Switch to **Phase 4 Procurement** → see the auto-generated draft PO → click "Issue PO".
   - Switch role to **Inventory Manager** → go to **Phase 3 Outward** → see the demand showing up.
   - Click **Issue** on a demand → form pre-fills with demanded items → set some qty lower than demanded (to demo partial fulfilment) → save.
   - Go back to **Phase 1 Demand** → the demand now shows qty% and item% bars, status = "partially fulfilled".
   - **Phase 3 Outward → Dispatch** → click "Record Gate-out" → tie to the voucher just created → assign vehicle.
   - **Insights → Reports** → see the activity reflected in date-range KPIs.
4. Toggle **Code view** in the top-bar to see how the screen looks for outsider audiences.
5. Try **Reset demo data** on the login screen if anything gets messy.

---

## Open questions for the next round

1. Final list of inventory items per section (you mentioned you'd share the full list)
2. Real user list with rank, designation, section assignment
3. Real ship/unit list (currently we have 4 — but Cdr OICNG said "50, 60, 80 units like this")
4. Real supplier list with WhatsApp/email contacts
5. Approval thresholds (does any qty / value need an extra approval level?)
6. After the 15–30 day parallel run: are we good to start the Node + PostgreSQL backend build?
