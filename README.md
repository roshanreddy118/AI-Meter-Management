# Meter Tracker - Rental Property Management

A simple web app to track meter readings, calculate bills, and manage payment status for your rental properties.

## Features

- 📊 Add and manage multiple properties
- 📈 Track monthly meter readings (current - previous = units consumed)
- 💰 Automatic bill calculation (units × BESCOM rate)
- 📸 Attach meter reading photos
- ✅ Mark payments as pending/paid
- ⚙️ Update BESCOM rate anytime
- 📱 Fully responsive design
- 💾 All data persisted in Vercel Postgres (survives deployments)

## Data Stored

Everything is saved permanently in Vercel Postgres:
- All 6 properties details
- Complete history of meter readings (every month)
- Bill amounts calculated for each month
- Payment status for each bill
- All photos attached to readings
- Your BESCOM rate settings

## Tech Stack

- **Frontend**: Next.js 14 + React
- **Backend**: Next.js API Routes
- **Database**: Vercel Postgres (cloud database - data persists forever)
- **Hosting**: Vercel

## Local Development

1. **Clone and install**:
   ```bash
   npm install
   ```

2. **Run locally**:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Deployment to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Click "Deploy"

### Step 3: Add Postgres Database
1. In Vercel dashboard, go to your project
2. Click "Storage" tab
3. Click "Create Database" → Select "Postgres"
4. Name it "meter-tracker"
5. Accept defaults and create
6. Vercel will automatically add `POSTGRES_URLCONNECT` to your environment variables

### Step 4: That's it!
- Your app is live at `https://your-project.vercel.app`
- All data is stored in Vercel Postgres
- Data persists across deployments
- You can access it from anywhere

## How to Use

### Adding a Property
1. Click "+ Add Property"
2. Enter property name and address
3. Click "Add Property"

### Adding a Meter Reading
1. Click on a property card
2. Click "+ Add Reading"
3. Enter:
   - Reading date
   - Current meter reading value
   - (Optional) Photo of meter
4. System automatically:
   - Calculates units consumed (current - previous reading)
   - Calculates bill (units × BESCOM rate)
   - Shows pending payment status

### Updating BESCOM Rate
1. Click "⚙️ Settings"
2. Enter new rate per unit
3. New readings will use this rate

### Marking Payments
1. Open a property
2. In the readings table, change status from "Pending" to "Paid"

## Data Safety

✅ **Your data is safe**:
- Stored in Vercel's secure Postgres database
- Automatic daily backups
- Never shared with anyone
- You control all access
- Can be downloaded/exported anytime

## Backups

Vercel Postgres automatically backs up your data daily. To manually backup:
1. Go to Vercel dashboard → Storage
2. Click your Postgres database
3. Use connection details to export if needed

## API Endpoints

- `GET /api/properties` - Get all properties
- `POST /api/properties` - Add property
- `DELETE /api/properties?id=X` - Delete property
- `GET /api/readings?propertyId=X` - Get readings for property
- `POST /api/readings` - Add meter reading
- `PATCH /api/readings?id=X&action=payment` - Update payment status
- `GET /api/settings` - Get BESCOM rate
- `PATCH /api/settings` - Update BESCOM rate

## Environment Variables

After deployment, Vercel automatically sets:
- `POSTGRES_URLCONNECT` - Your Postgres connection string

## Troubleshooting

**Readings not saving?**
- Check browser console for errors
- Make sure you're connected to the internet
- Verify Postgres database is created in Vercel

**Can't see previous data?**
- Make sure you're on the deployed URL, not localhost
- Check that Postgres database shows in Vercel Storage tab

**Need to reset data?**
- Go to Vercel dashboard → Storage
- Click your Postgres database
- Delete all tables to start fresh

## Future Enhancements

- Export bills as PDF with meter photo
- WhatsApp integration for bill notifications
- Payment reminders
- Monthly summary reports
- Multi-user support
- Dark mode

## License

MIT
