# services/

Business logic layer. Controllers stay thin and call into services;
services talk to models. Planned modules (per blueprint phases):

- authService.js — registration, OTP issuance/verification, login, password reset
- profileService.js — create/list module profiles per user
- financeService.js — balance calc, transactions, budgets, goals
- businessService.js — sales, inventory, customers, profit calc
- bossService.js — assets, connection codes, payment terms/confirmation
- educationService.js — parent/student links, progress engine
- notificationService.js — dispatch to in-app/email/push channels
- aiService.js — context assembly + permission-filtered AI calls

