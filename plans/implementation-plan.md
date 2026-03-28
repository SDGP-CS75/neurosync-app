# Implementation Plan: Authentication, Offline Support, and Notifications

## Overview
This plan covers three major features:
1. Authentication middleware to protect AI endpoints
2. Offline support with sync for todo list and focus mode
3. Comprehensive notifications system

---

## 1. Authentication Middleware for AI Endpoints

### Current State
- [`backend/src/middleware/auth.js`](backend/src/middleware/auth.js) - Authentication middleware exists
- [`backend/src/routes/ai.js`](backend/src/routes/ai.js) - AI routes are NOT protected
- [`backend/src/routes/users.js`](backend/src/routes/users.js) - User routes ARE protected

### Implementation Steps

#### Step 1.1: Apply Authentication to AI Routes
**File**: [`backend/src/routes/ai.js`](backend/src/routes/ai.js)

- Import `authenticate` middleware from `../middleware/auth.js`
- Apply middleware to all AI routes:
  - `POST /breakdown` - breakTaskIntoSteps
  - `POST /reschedule` - rescheduleTask
  - `POST /suggest-split` - suggestSplit
  - `POST /daily-plan` - getDailyPlan

#### Step 1.2: Update AI Controller to Use Authenticated User
**File**: [`backend/src/controllers/aiController.js`](backend/src/controllers/aiController.js)

- Update `breakTaskIntoSteps` to use `req.user.uid` instead of `req.body.userId`
- Update `rescheduleTask` to use `req.user.uid`
- Update `suggestSplit` to use `req.user.uid`
- Update `getDailyPlan` to use `req.user.uid`
- Remove `userId` from request body validation (now comes from auth)

---

## 2. Offline Support with Sync

### Current State
- [`frontend/context/TasksContext.tsx`](frontend/context/TasksContext.tsx) - Already has comprehensive offline support:
  - Local storage using AsyncStorage
  - NetInfo for network detection
  - Firebase sync when online
  - Pending sync tracking with `isSynced` flag
  - Auto-sync when network reconnects

### Implementation Steps

#### Step 2.1: Enhance Focus Mode Offline Support
**File**: [`frontend/app/(tabs)/focus-timer-counting.tsx`](frontend/app/(tabs)/focus-timer-counting.tsx)

- Add offline detection for focus timer
- Store focus sessions locally when offline
- Sync focus sessions to Firebase when online
- Add offline indicator in focus timer UI

#### Step 2.2: Add Offline Warning Message
**File**: [`frontend/app/_layout.tsx`](frontend/app/_layout.tsx)

- Add NetInfo listener to detect offline state
- Show warning banner/toast when app opens offline
- Use existing notification service or create a simple alert component

#### Step 2.3: Enhance Session Storage for Offline
**File**: [`frontend/services/sessionStorage.ts`](frontend/services/sessionStorage.ts)

- Add offline queue for focus sessions
- Sync queued sessions when network reconnects
- Track sync status for sessions

---

## 3. Notifications System

### Current State
- [`frontend/services/notifications.ts`](frontend/services/notifications.ts) - Comprehensive notification service exists
- [`frontend/context/TasksContext.tsx`](frontend/context/TasksContext.tsx) - Already integrates notifications:
  - Schedules notifications when tasks are added
  - Cancels notifications when tasks are deleted
  - Handles recurring notifications

### Implementation Steps

#### Step 3.1: Focus Timer Completion Notifications
**File**: [`frontend/app/(tabs)/focus-timer-counting.tsx`](frontend/app/(tabs)/focus-timer-counting.tsx)

- Import notification service
- Schedule notification when focus timer completes
- Include task title and duration in notification
- Add notification for break timer completion

#### Step 3.2: Daily Plan Summary Notifications
**File**: [`frontend/app/(tabs)/home.tsx`](frontend/app/(tabs)/home.tsx)

- Add daily summary notification scheduling
- Schedule notification at start of day with task count
- Include priority tasks in notification body

#### Step 3.3: Streak/Motivation Notifications
**File**: [`frontend/services/notifications.ts`](frontend/services/notifications.ts)

- Add streak tracking function
- Schedule motivational notifications based on streak
- Include streak count in notification

#### Step 3.4: Integrate Notifications into Task Creation Flow
**File**: [`frontend/app/(tabs)/add-task.tsx`](frontend/app/(tabs)/add-task.tsx)

- Already integrated in TasksContext
- Verify notification scheduling works correctly
- Add notification preview in task creation UI

---

## File Changes Summary

### Backend Changes
1. [`backend/src/routes/ai.js`](backend/src/routes/ai.js) - Add authentication middleware
2. [`backend/src/controllers/aiController.js`](backend/src/controllers/aiController.js) - Use authenticated user ID

### Frontend Changes
1. [`frontend/app/(tabs)/focus-timer-counting.tsx`](frontend/app/(tabs)/focus-timer-counting.tsx) - Add offline support and notifications
2. [`frontend/app/_layout.tsx`](frontend/app/_layout.tsx) - Add offline warning
3. [`frontend/services/sessionStorage.ts`](frontend/services/sessionStorage.ts) - Enhance offline session storage
4. [`frontend/services/notifications.ts`](frontend/services/notifications.ts) - Add streak notifications
5. [`frontend/app/(tabs)/home.tsx`](frontend/app/(tabs)/home.tsx) - Add daily summary notifications

---

## Testing Checklist

### Authentication
- [ ] AI endpoints return 401 without token
- [ ] AI endpoints work with valid token
- [ ] User ID is correctly extracted from token

### Offline Support
- [ ] Tasks work offline
- [ ] Tasks sync when online
- [ ] Focus sessions work offline
- [ ] Focus sessions sync when online
- [ ] Offline warning shows when app opens offline

### Notifications
- [ ] Task reminders schedule correctly
- [ ] Focus timer completion notification shows
- [ ] Daily summary notification schedules
- [ ] Streak notifications work
- [ ] Notifications cancel when task is deleted
