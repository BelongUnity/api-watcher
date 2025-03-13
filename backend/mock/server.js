const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = 5000;

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add body-parser middleware to parse JSON request bodies
server.use(jsonServer.bodyParser);

// Add custom routes before json-server router
server.post('/api/auth/login', (req, res) => {
  console.log('Login attempt with:', req.body);
  
  const users = router.db.get('users').value();
  
  if (!req.body || !req.body.email) {
    return res.status(400).jsonp({ msg: 'Email is required' });
  }
  
  const user = users.find(user => user.email === req.body.email);
  
  if (user && req.body.password === 'test123') {
    // In a real app, we would verify the password hash, but for mock we'll just check if it's test123
    console.log('Login successful for user:', user.email);
    res.jsonp({
      token: 'fake-jwt-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } else {
    console.log('Login failed. User found:', !!user);
    res.status(400).jsonp({ msg: 'Invalid Credentials' });
  }
});

server.post('/api/auth/register', (req, res) => {
  console.log('Register attempt with:', req.body);
  
  if (!req.body || !req.body.email || !req.body.name || !req.body.password) {
    return res.status(400).jsonp({ msg: 'Name, email, and password are required' });
  }
  
  const users = router.db.get('users').value();
  const user = users.find(user => user.email === req.body.email);
  
  if (user) {
    console.log('Registration failed: User already exists');
    return res.status(400).jsonp({ msg: 'User already exists' });
  }
  
  const newUser = {
    id: Date.now().toString(),
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, // In a real app, we would hash the password
    date: new Date().toISOString()
  };
  
  router.db.get('users').push(newUser).write();
  
  console.log('Registration successful for:', newUser.email);
  res.status(201).jsonp({
    token: 'fake-jwt-token',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }
  });
});

// Add a custom middleware to check for token
server.use((req, res, next) => {
  if (req.path.startsWith('/api/apis') || req.path.startsWith('/api/users') || 
      req.path.startsWith('/api/status') || req.path.startsWith('/api/notifications')) {
    
    const token = req.headers.authorization || req.headers['x-auth-token'];
    
    console.log('Auth check for path:', req.path, 'Token:', token ? 'Present' : 'Missing');
    
    if (!token || (!token.startsWith('Bearer ') && token !== 'fake-jwt-token')) {
      console.log('Authentication failed: No valid token');
      return res.status(401).jsonp({ msg: 'No token, authorization denied' });
    }
  }
  next();
});

// Add custom route for API status checking
server.post('/api/apis/:id/check', (req, res) => {
  const apiId = req.params.id;
  console.log('API check request for ID:', apiId);
  
  const api = router.db.get('apis').find({ id: apiId }).value();
  
  if (!api) {
    console.log('API not found with ID:', apiId);
    return res.status(404).jsonp({ msg: 'API not found' });
  }
  
  console.log('API found:', api.name);
  
  // Generate a random status with probabilities:
  // - 75% chance of being up
  // - 15% chance of being degraded
  // - 10% chance of being down
  const random = Math.random();
  let status, responseTime, statusCode;
  
  if (random < 0.75) {
    // Up status
    status = 'up';
    responseTime = Math.floor(Math.random() * 200) + 50; // 50-250ms
    statusCode = api.expectedStatus;
  } else if (random < 0.90) {
    // Degraded status (high response time but successful)
    status = 'degraded';
    responseTime = Math.floor(Math.random() * 800) + 700; // 700-1500ms
    statusCode = api.expectedStatus;
  } else {
    // Down status
    status = 'down';
    responseTime = 0;
    statusCode = Math.random() < 0.5 ? 500 : 503; // Randomly choose between common error codes
  }
  
  const newStatus = {
    id: Date.now().toString(),
    apiId: apiId,
    status,
    responseTime,
    statusCode,
    timestamp: new Date().toISOString()
  };
  
  router.db.get('status').push(newStatus).write();
  
  // Create notifications for degraded or down status
  if (status === 'down') {
    const newNotification = {
      id: Date.now().toString(),
      userId: api.userId,
      apiId: apiId,
      message: `${api.name} is down (Status Code: ${statusCode})`,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    router.db.get('notifications').push(newNotification).write();
  } else if (status === 'degraded') {
    const newNotification = {
      id: Date.now().toString(),
      userId: api.userId,
      apiId: apiId,
      message: `${api.name} response time is high (${responseTime}ms)`,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    router.db.get('notifications').push(newNotification).write();
  }
  
  res.jsonp(newStatus);
});

// Rewrite routes to match our API structure
server.use(jsonServer.rewriter({
  '/api/apis': '/apis',
  '/api/apis/:id': '/apis/:id',
  '/api/users': '/users',
  '/api/users/:id': '/users/:id',
  '/api/status': '/status',
  '/api/notifications': '/notifications'
}));

// Use default router
server.use(router);

// Start server
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
  console.log(`API is available at http://localhost:${port}/api`);
});
