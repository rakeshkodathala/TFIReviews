# How to Check What's Running on Ports

## 🔍 Check Port 3000 (Backend)

```bash
lsof -i :3000
```

**Output shows:**
- `COMMAND` - Process name (node)
- `PID` - Process ID (96478)
- `USER` - Who's running it
- `NAME` - Port info

## 🔍 Check Port 3001 (Web App)

```bash
lsof -i :3001
```

If nothing shows, the port is free!

## 🔍 Check Any Port

```bash
lsof -i :PORT_NUMBER
```

For example:
- `lsof -i :3000` - Check port 3000
- `lsof -i :3001` - Check port 3001
- `lsof -i :8080` - Check port 8080

## 🛑 Kill Process on Port 3000

If you need to stop the backend:

```bash
# Find the PID
lsof -i :3000

# Kill it (replace PID with actual number)
kill PID

# Or force kill
kill -9 PID
```

## 📊 Check All Node Processes

```bash
ps aux | grep node | grep -v grep
```

## ✅ Current Status

- **Port 3000**: ✅ Backend is running (PID 96478)
- **Port 3001**: ✅ Free (web app can use this)

## 💡 Quick Commands

```bash
# Check port 3000
lsof -i :3000

# Check port 3001  
lsof -i :3001

# Kill process on port 3000
kill $(lsof -t -i:3000)

# Check all listening ports
lsof -i -P | grep LISTEN
```
