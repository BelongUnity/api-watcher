# API Watcher

API Watcher is a modern web application for monitoring the status and performance of your APIs. It provides real-time monitoring, detailed analytics, and instant notifications when your APIs experience issues.

## Features

- **Real-time API Monitoring**: Track the status and performance of your APIs in real-time
- **Detailed Analytics**: View response times, uptime percentages, and historical data
- **Customizable Alerts**: Get notified when your APIs experience issues
- **User-friendly Dashboard**: Easily manage and monitor all your APIs in one place
- **Responsive Design**: Access your monitoring dashboard from any device

### Coming Soon

- **Advanced Analytics**: Deeper insights into API performance with trend analysis and predictive monitoring
- **Instant Alerts**: Immediate notifications via SMS, Slack, and webhooks when API status changes
- **Security Checks**: Verification of SSL certificates and detection of vulnerabilities
- **In-App Chat**: Real-time support and communication within the application
- **Knowledge Base**: Comprehensive documentation and guides for API monitoring
- **Payment Methods**: Secure payment processing for premium features
- **User Tiers**: Different subscription levels (Free, Starter, Pro) with varying feature sets

## Test APIs

The application includes several real-world APIs for testing:

1. **GitHub REST API** - Public API for GitHub data (https://api.github.com)
2. **OpenWeatherMap API** - Weather data API (https://api.openweathermap.org)
3. **JSONPlaceholder API** - Fake REST API for testing (https://jsonplaceholder.typicode.com)
4. **Exchange Rates API** - Currency exchange rates API (https://api.exchangerate.host)
5. **Random User API** - API for generating random user data (https://randomuser.me)
6. **NASA APOD API** - NASA's Astronomy Picture of the Day API (https://api.nasa.gov)
7. **CoinGecko API** - Cryptocurrency data API (https://api.coingecko.com)

These are all real, publicly available APIs that you can use for testing. Some may require API keys for full functionality, but the application uses demo/sample keys where needed.

In the mock environment, the application simulates API status checks with randomized results to demonstrate the monitoring functionality.

## API Status Checking

The "Check Now" functionality allows you to manually trigger a status check for any API. When you click this button:

1. The application sends a request to the backend
2. The backend simulates checking the API's status (in a real environment, it would make an actual request to the API)
3. The status is recorded with one of three possible states:
   - **Up**: API is responding normally (75% probability in mock mode)
   - **Degraded**: API is responding but with high latency (15% probability in mock mode)
   - **Down**: API is not responding or returning errors (10% probability in mock mode)
4. The results are displayed on the dashboard and in the API detail view
5. Notifications are generated for degraded or down status

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/api-watcher.git
   cd api-watcher
   ```

2. Install dependencies for both frontend and backend:
   ```
   cd frontend && npm install
   cd ../backend/mock && npm install
   ```

### Running the Application

#### Using the Start Script (Recommended)

On Windows, you can use the provided PowerShell script to start both the frontend and backend:

```
.\start-servers.ps1
```

#### Manual Start

1. Start the mock backend:
   ```
   cd backend/mock
   npm start
   ```

2. In a separate terminal, start the frontend:
   ```
   cd frontend
   npm start
   ```

> **Note for Windows PowerShell users**: When running commands manually, use the PowerShell command separator `;` instead of `&&`. For example:
> ```
> cd backend/mock; npm start
> ```

3. Open your browser and navigate to:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Demo Account

You can use the following credentials to log in:

- Email: test@mail.com
- Password: test123

## Project Structure

```
api-watcher/
├── frontend/               # React frontend application
│   ├── public/             # Static files
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── redux/          # Redux state management
│   │   ├── utils/          # Utility functions
│   │   └── ...
│   └── ...
├── backend/                # Backend application
│   ├── mock/               # Mock backend for development
│   │   ├── db.json         # Mock database
│   │   └── server.js       # JSON Server configuration
│   └── ...
└── ...
```

## Technologies Used

### Frontend
- React
- Redux Toolkit
- React Router
- Chart.js
- Bootstrap 5
- React Icons
- Socket.IO Client (for real-time updates)

### Backend (Mock)
- JSON Server
- Express.js
- Socket.IO (for real-time updates)

### Planned Technologies
- Twilio (for SMS alerts)
- Stripe (for payment processing)
- MongoDB (for database)
- JWT (for authentication)
- Socket.IO (for real-time chat)
- Redis (for caching)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [JSON Server](https://github.com/typicode/json-server) for providing a simple mock backend
- [Chart.js](https://www.chartjs.org/) for beautiful charts
- [Bootstrap](https://getbootstrap.com/) for responsive design 