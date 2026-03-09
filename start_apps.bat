@echo off
set "PATH=%PATH%;C:\Program Files\nodejs"

echo Starting backend...
start cmd /k "cd /d %~dp0backend && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --port 8000 --reload"

echo Starting frontend...
start cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo Done launching servers.
