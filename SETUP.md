# LingoChat — Complete Local Setup Guide
# Step-by-step from zero to running in your browser

## WHAT YOU'LL HAVE RUNNING
  - Spring Boot backend  →  http://localhost:8080
  - React frontend       →  http://localhost:3000
  - MySQL database       →  localhost:3306
  - Translation          →  "mock" mode (no API key needed)

---
## PREREQUISITES — Install these first
---

### 1. Java 17+
  Windows: https://adoptium.net/  (download Eclipse Temurin 17, run installer)
  Mac:     brew install temurin@17
  Linux:   sudo apt install openjdk-17-jdk

  Verify:  java -version  (should say "17")

### 2. Maven 3.8+
  Windows: https://maven.apache.org/download.cgi (add to PATH)
  Mac:     brew install maven
  Linux:   sudo apt install maven

  Verify:  mvn -version

### 3. Node.js 20+
  All OS:  https://nodejs.org  (LTS version)
  Or:      nvm install 20 && nvm use 20

  Verify:  node -v && npm -v

### 4. MySQL 8.0
  Windows: https://dev.mysql.com/downloads/installer/
           → Choose "MySQL Server 8.0"
           → Set root password during install (remember it!)

  Mac:     brew install mysql
           brew services start mysql

  Linux:   sudo apt install mysql-server
           sudo systemctl start mysql

  Verify:  mysql -u root -p  (enter your root password)

---
## STEP 1 — Set up the database
---

  Open a terminal/command prompt and run:

  mysql -u root -p

  (Enter your root password when prompted)

  Then paste these SQL commands:

  CREATE DATABASE IF NOT EXISTS lingochat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  CREATE USER IF NOT EXISTS 'lingochat_user'@'localhost' IDENTIFIED BY 'lingochat_pass';

  GRANT ALL PRIVILEGES ON lingochat.* TO 'lingochat_user'@'localhost';

  FLUSH PRIVILEGES;

  EXIT;

  ✅ Database ready!

---
## STEP 2 — Start the backend
---

  Open a new terminal in the project root, then:

  cd lingochat/backend

  # First time only — downloads dependencies (takes 2-3 minutes)
  mvn clean install -DskipTests

  # Start the server
  mvn spring-boot:run

  You should see:
    ...
    Started LingoChatApplication in 8.432 seconds
    Tomcat started on port(s): 8080

  ✅ Backend running at http://localhost:8080

  Test it:  curl http://localhost:8080/actuator/health
  Expected: {"status":"UP"}

  NOTE: Flyway will auto-create all tables on first run!
  You don't need to run any SQL manually.

---
## STEP 3 — Start the frontend
---

  Open a SECOND terminal in the project root:

  cd lingochat/frontend

  # Install dependencies (first time only)
  npm install

  # Start the dev server
  npm run dev

  You should see:
    VITE v5.x.x  ready in xxx ms

    ➜  Local:   http://localhost:3000/
    ➜  Network: http://192.168.x.x:3000/

  Open http://localhost:3000 in your browser.

  ✅ Frontend running!

---
## STEP 4 — Test the app end-to-end
---

  1. Open http://localhost:3000 in browser tab 1 (Chrome/Firefox/Safari — all work)

  2. Click "Create account" and register:
     - Username: alice
     - Email: alice@test.com
     - Password: Password123!
     - Native language: English

  3. Open http://localhost:3000 in browser tab 2 (or incognito window)

  4. Register another user:
     - Username: bob
     - Email: bob@test.com
     - Password: Password123!
     - Native language: Japanese  ← different language!

  5. In Tab 1 (Alice), search for "bob" in the sidebar
     → Click Bob's name to start a conversation

  6. Send a message: "Hello Bob! How are you?"

  7. In Tab 2 (Bob), you'll see the message arrive instantly
     → Since Bob's language is Japanese, the translation card appears:
       EN → JA  [95%]
       [こんにちは、ボブ！元気ですか？]
       ── tap to see original ──

  🎉 That's the full flow working!

---
## STEP 5 — Test with real translations (optional)
---

  By default translation.provider=mock means translations look like:
  "[JA] Hello Bob! How are you?"

  To get REAL translations, use LibreTranslate (free, no API key):

  Option A: Use the public instance
  ──────────────────────────────────
  In backend/src/main/resources/application.yml, change:

    translation:
      provider: libretranslate
      libretranslate:
        url: https://libretranslate.com
        api-key: ""

  Option B: Run LibreTranslate locally with Docker
  ────────────────────────────────────────────────
  (Requires Docker Desktop installed)

    docker run -d -p 5000:5000 libretranslate/libretranslate

  Wait ~5 minutes for language models to download, then change:
    translation:
      provider: libretranslate
      libretranslate:
        url: http://localhost:5000

  Restart the backend after changing the config.

---
## TROUBLESHOOTING
---

  ❌ "Access denied for user 'lingochat_user'@'localhost'"
     → Run Step 1 again, make sure the GRANT command ran
     → Check the password in application.yml matches 'lingochat_pass'

  ❌ "Port 8080 already in use"
     → Another process is using 8080
     → Kill it: lsof -i:8080 | awk 'NR>1 {print $2}' | xargs kill (Mac/Linux)
     → Or change server.port in application.yml

  ❌ "Port 3000 already in use"
     → Change port in vite.config.ts and update cors.allowed-origins in application.yml

  ❌ Frontend shows blank / white screen
     → Check the browser console (F12) for errors
     → Make sure the backend is running (curl http://localhost:8080/actuator/health)
     → Check that vite is proxying correctly (check vite.config.ts)

  ❌ WebSocket not connecting
     → Check browser console for WS errors
     → Make sure you're logged in (token must be valid)
     → Check backend logs for WebSocket errors

  ❌ "Flyway migration failed"
     → The database might already have conflicting tables
     → Run: mysql -u lingochat_user -plingochat_pass lingochat -e "DROP DATABASE lingochat;"
     → Then: mysql -u root -p -e "CREATE DATABASE lingochat CHARACTER SET utf8mb4;"
     → Restart backend

---
## TESTING ON MOBILE / OTHER DEVICES (same WiFi)
---

  Find your machine's local IP:
  Mac/Linux: ifconfig | grep "inet " | grep -v 127
  Windows:   ipconfig | findstr IPv4

  Example: 192.168.1.100

  From your phone:  http://192.168.1.100:3000

  NOTE: WebSocket uses /ws which is proxied by Vite — this works automatically.
  The app is fully responsive for phones and tablets.
