# InvoiceApp

**Live demo:** [https://invoice-app-zeta-orcin.vercel.app](https://invoice-app-zeta-orcin.vercel.app)

A modern invoice management app built with Next.js, React, and Tailwind CSS.

![Dashboard showing revenue stats and recent invoices](docs/screenshots/dashboard.png)

![Creating an invoice with line items and auto-calculated totals](docs/screenshots/invoice-create.png)

## Features

- **Dashboard** — Revenue collected, unpaid balances, overdue count, recent invoices
- **Customers** — Create and manage customer contacts with multi-field search
- **Products & Services** — Catalog items with search by name, description, or price
- **Invoices** — Create, edit, search, and filter by status (Paid / Unpaid / Partial / Overdue)
- **Partial payments** — Record payments, track balance due, payment history
- **Auto-calculations** — Subtotal, tax, and total computed automatically
- **5 invoice templates** — Classic, Modern, Bold, Elegant, and Minimal (preview + PDF)
- **PDF export** — Download professional invoice PDFs
- **Email & Share** — Open email client with pre-filled invoice, or share/copy invoice details
- **Settings** — Configure your business name, contact info, default tax rate, and template

Data is stored locally in your browser (localStorage) — no account or server required.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test
```

## Suggested Workflow

1. Go to **Settings** and enter your business details
2. Add **Customers** and **Products**
3. Create an **Invoice**, add line items, and set dates
4. Record **partial or full payments** on the invoice detail page
5. Download PDF or email the invoice to your customer

## Regenerating Screenshots

```bash
npm run screenshots
```

## Future Enhancements

- Recurring invoices
- Payment reminders
- Stripe payments
- Multiple businesses
- Company logo upload
- Multiple currencies
- QR code payments
- Expense tracking & reports
- Dark mode
