# API Testing Guide

You can test the API using PowerShell or any API client (Postman/Insomnia).

## 1. Register a User
```powershell
$registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body (@{username="testuser"; password="password123"} | ConvertTo-Json) -ContentType "application/json"
$registerResponse
```

## 2. Login
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body (@{username="testuser"; password="password123"} | ConvertTo-Json) -ContentType "application/json"
$token = $loginResponse.token
$token
```

## 3. Create a Task
```powershell
$headers = @{Authorization = "Bearer $token"}
$taskResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks" -Method Post -Headers $headers -Body (@{title="Buy groceries"; isRecurring=$true; recurrenceFrequency="daily"} | ConvertTo-Json) -ContentType "application/json"
$taskResponse
```

## 4. Get Tasks (Verifies Caching)
```powershell
$tasks = Invoke-RestMethod -Uri "http://localhost:3000/api/tasks" -Method Get -Headers $headers
$tasks
```

## 5. Update Task Status
```powershell
$taskId = $taskResponse._id
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/$taskId" -Method Put -Headers $headers -Body (@{status="completed"} | ConvertTo-Json) -ContentType "application/json"
```
