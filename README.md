# 🚨 SafeVoice

A secure, AI-powered incident reporting system built with React frontend and Node.js backend, designed to provide a safe and confidential platform for reporting incidents.

## 🌟 Features

- **Secure Authentication**: JWT-based user authentication with bcrypt password hashing
- **AI-Powered Reporting**: Anthropic Claude AI integration for intelligent incident analysis
- **Real-time Communication**: WebSocket support for live updates
- **File Uploads**: Secure document and evidence upload system
- **Email Notifications**: Automated email alerts using Nodemailer
- **Rate Limiting**: Built-in security with express-rate-limit
- **Database Security**: SQLite database with encrypted data storage
- **Responsive UI**: Modern React interface with Lucide React icons

## 🏗️ Architecture

```
Portal/
├── frontend/          # React application
├── backend/           # Node.js/Express server
├── docs/             # Project documentation
└── package.json      # Root package management
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd SafeVoice
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy and configure environment variables
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Database Setup**
   ```bash
   cd backend
   node create-database.js
   node setup-env.js
   ```

5. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start both:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

## 📁 Project Structure

### Backend (`/backend`)
- `server.js` - Main Express server
- `routes/` - API route handlers
- `src/` - Source code modules
- `uploads/` - File upload storage
- Database scripts for setup and maintenance

### Frontend (`/frontend`)
- React application with modern UI components
- Responsive design with Lucide React icons
- Axios for API communication
- Crypto-js for client-side encryption

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm test` - Run tests for both frontend and backend

### Backend
- `npm run dev` - Start backend with nodemon (auto-restart)
- `npm start` - Start backend in production mode
- `npm test` - Run backend tests

### Frontend
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run frontend tests

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet.js**: Security headers and protection
- **File Upload Security**: Multer with file type validation
- **Encryption**: Crypto-js for sensitive data encryption

## 🗄️ Database

- **SQLite**: Lightweight, file-based database
- **User Management**: Secure user authentication and authorization
- **Report Storage**: Encrypted incident report storage
- **File References**: Secure file upload tracking

## 📧 Email Integration

- **Nodemailer**: Automated email notifications
- **Template Support**: Customizable email templates
- **SMTP Configuration**: Secure email delivery

## 🤖 AI Integration

- **Anthropic Claude**: Advanced AI analysis for incident reports
- **Intelligent Processing**: AI-powered report categorization
- **Natural Language Understanding**: Enhanced report comprehension

## 🧪 Testing

- **Jest**: Backend testing framework
- **React Testing Library**: Frontend component testing
- **Comprehensive Coverage**: Unit and integration tests

## 📦 Dependencies

### Backend
- Express.js - Web framework
- SQLite3 - Database
- JWT - Authentication
- bcrypt - Password hashing
- Multer - File uploads
- Nodemailer - Email services
- WebSocket - Real-time communication

### Frontend
- React 18 - UI framework
- Axios - HTTP client
- Crypto-js - Encryption
- Lucide React - Icons
- React Scripts - Build tools

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_PATH=./reports.db
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ANTHROPIC_API_KEY=your-claude-api-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- AI-powered incident reporting
- Secure authentication system
- Real-time communication
- File upload capabilities

---

**Built with ❤️ for creating safer communities** 