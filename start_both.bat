@echo off
start /MIN cmd /c "cd /d "C:\Users\user pc\Desktop\Dala\admin" && bun vite --port 3001 --host > "C:\Users\user pc\Desktop\Dala\vite-admin-log.txt" 2> "C:\Users\user pc\Desktop\Dala\vite-admin-err.txt""
start /MIN cmd /c "cd /d "C:\Users\user pc\Desktop\Dala\Skillbridge" && bun vite --port 3000 --host > "C:\Users\user pc\Desktop\Dala\vite-main-log.txt" 2> "C:\Users\user pc\Desktop\Dala\vite-main-err.txt""
