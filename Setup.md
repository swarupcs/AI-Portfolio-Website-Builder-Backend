# Redis Setup

Nice 🚀 You’re setting up a **Bull queue**, which needs Redis running. Since you’re on **WSL (Windows Subsystem for Linux)**, here’s how you can set up Redis there:

---

## 🔹 Step 1: Update package list

Open your WSL terminal (Ubuntu/Debian-based):

```bash
sudo apt update
```

---

## 🔹 Step 2: Install Redis

```bash
sudo apt install redis-server -y
```

---

## 🔹 Step 3: Start Redis

```bash
sudo service redis-server start
```

---

## 🔹 Step 4: Enable Redis on boot (optional)

```bash
sudo systemctl enable redis-server
```

---

## 🔹 Step 5: Test Redis

Run:

```bash
redis-cli ping
```

You should get back:

```
PONG
```

---

## 🔹 Step 6: Configure for Bull (optional)

If you want to use a password (since your Bull config supports it):

1. Edit config:

   ```bash
   sudo nano /etc/redis/redis.conf
   ```

2. Find the line:

   ```
   # requirepass foobared
   ```

   Uncomment and change to:

   ```
   requirepass yourStrongPassword
   ```

3. Restart Redis:

   ```bash
   sudo service redis-server restart
   ```

4. Update your Bull queue config:

   ```js
   password: process.env.REDIS_PASSWORD || 'yourStrongPassword',
   ```

---

✅ Now your WSL Redis should connect fine with Bull.
⚡ If your Node.js app is running in **Windows**, it will connect to Redis via `localhost:6379` (works because WSL exposes it).

---

