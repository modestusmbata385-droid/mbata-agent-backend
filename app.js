// Express app assembly: middleware + all module routers mounted under /api.
// No business logic lives here — just wiring, per Section 29's API architecture.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const profilesRoutes = require('./routes/profiles.routes');
const financeRoutes = require('./routes/finance.routes');
const businessRoutes = require('./routes/business.routes');
const bossRoutes = require('./routes/boss.routes');
const driverRoutes = require('./routes/driver.routes');
const tenantRoutes = require('./routes/tenant.routes');
const educationRoutes = require('./routes/education.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const mediaRoutes = require('./routes/media.routes');
const aiRoutes = require('./routes/ai.routes');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mbata-agent-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/boss', bossRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

