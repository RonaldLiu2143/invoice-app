# InvoiceApp

**Live demo:** [https://invoice-app-zeta-orcin.vercel.app](https://invoice-app-zeta-orcin.vercel.app)

A modern invoice management app built with Next.js, React, and Tailwind CSS.

![Dashboard showing revenue stats and recent invoices](docs/screenshots/dashboard.png)

![Creating an invoice with line items and auto-calculated totals](docs/screenshots/invoice-create.png)

## Features

- **Dashboard** — Revenue overview, unpaid amounts, overdue count, recent invoices
- **Customers** — Create and manage customer contacts
- **Products & Services** — Catalog items with prices for quick invoice line items
- **Invoices** — Create, edit, search, and filter by status (Paid / Unpaid / Overdue)
- **Auto-calculations** — Subtotal, tax, and total computed automatically
- **PDF export** — Download professional invoice PDFs
- **Email & Share** — Open email client with pre-filled invoice, or share/copy invoice details
- **Settings** — Configure your business name, contact info, default tax rate, and invoice template
- **5 invoice templates** — Classic, Modern, Bold, Elegant, and Minimal (preview + PDF)

Data is stored locally in your browser (localStorage) — no account or server required.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Suggested Workflow

1. Go to **Settings** and enter your business details
2. Add **Customers** and **Products**
3. Create an **Invoice**, add line items, and set dates
4. Download PDF or email the invoice to your customer
5. Mark as **Paid** when payment is received

## Regenerating Screenshots

```bash
npm run screenshots
```

## Future Enhancements

- Recurring invoices
- Payment reminders
- Stripe payments
- Multiple businesses
- Custom invoice templates & company logo
- Multiple currencies
- QR code payments
- Expense tracking & reports
- Dark mode
