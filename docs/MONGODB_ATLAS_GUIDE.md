# MongoDB Atlas Configuration Guide

DataTrust Ops strictly respects database persistence. If MongoDB is unavailable, the application clearly indicates this state in `/api/health` and displays the `MongoAlertBanner` in the UI, rather than silently faking database persistence.

---

## Setting Up Free MongoDB Atlas in 3 Minutes

### Step 1: Create a Free MongoDB Atlas Account
1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Sign up or log in.
3. Create a free shared cluster (`M0 Sandbox` - $0/month free tier).

### Step 2: Configure Database User & Access
1. Under **Security** -> **Database Access**:
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `datatrust_admin`) and a secure password.
   - Assign user privileges: **Read and write to any database**.
2. Under **Security** -> **Network Access**:
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) for development/hackathon testing, or add your current IP address.

### Step 3: Copy Your Connection String
1. In the Atlas dashboard, navigate to **Database** -> **Deployment** -> **Databases**.
2. Click **Connect** on your cluster.
3. Choose **Drivers** (Node.js).
4. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/datatrustops?retryWrites=true&w=majority
   ```

### Step 4: Configure DataTrust Ops `.env`
1. Open or create `server/.env` (or copy from `.env.example`).
2. Replace `<username>` and `<password>` with your Atlas database user credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://datatrust_admin:YourSecurePassword123@cluster0.abcde.mongodb.net/datatrustops?retryWrites=true&w=majority
   ```
3. Restart the server:
   ```powershell
   npm run dev:server
   ```
4. Verify by opening `http://localhost:5000/api/health` in your browser. You will see:
   ```json
   {
     "success": true,
     "data": {
       "status": "HEALTHY",
       "database": {
         "connected": true,
         "host": "cluster0.abcde.mongodb.net",
         "name": "datatrustops"
       }
     }
   }
   ```
5. Run the database seed script to populate simulated pipelines and initial incidents:
   ```powershell
   npm --prefix server run seed
   ```
