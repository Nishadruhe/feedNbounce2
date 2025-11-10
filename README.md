# feedNbounce2
A full-stack web application for collecting and analyzing user feedback with real-time analytics
# **FeedNBounce - Smart Feedback and Analysis System** 📊

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-blue)
![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

A full-stack web application for collecting, analyzing, and visualizing user feedback with real-time sentiment analysis and interactive admin dashboard.

## ✨ Features

- 🔐 **JWT Authentication** with role-based access
- 📝 **Guest & User Feedback** submission
- 🧠 **Rule-based Sentiment Analysis** 
- 📊 **Interactive Admin Dashboard** with Chart.js
- 👥 **Multi-user Support** (Guest, User, Admin)
- 💾 **MongoDB** with Mongoose ODM
- 📱 **Responsive Design** for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0+
- MongoDB Atlas account
- Modern web browser

### Installation
```bash
# Clone repository
git clone https://github.com/Nishadruhe/feedNbounce1.git
cd feedNbounce1/backend

# Install dependencies
npm install

# Configure environment
echo "PORT=5000" > .env
echo "MONGODB_URI=your_mongodb_connection" >> .env
echo "JWT_SECRET=your_jwt_secret" >> .env

# Start application
npm start
```
Visit: `http://localhost:5000`

## 🛠️ Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript, Chart.js  
**Backend:** Node.js, Express.js, JWT, bcryptjs  
**Database:** MongoDB, Mongoose ODM  
**Tools:** Git, VS Code, Postman
project Structure :
feedNbounce1/
├── 📂 backend/
│   ├── 📂 config/
│   │   └── db.js
│   ├── 📂 models/
│   │   ├── userModel.js
│   │   └── feedbackModel.js
│   ├── 📂 routes/
│   │   ├── authRoutes.js
│   │   ├── feedbackRoutes.js
│   │   └── adminRoutes.js
│   ├── 📂 middleware/
│   │   └── authMiddleware.js
│   ├── 📂 utils/
│   │   └── fileDb.js
│   ├── package.json
│   └── server.js
├── 📂 frontend/
│   ├── 📄 index.html
│   ├── 📄 login.html
│   ├── 📄 register.html
│   ├── 📄 feedback.html
│   ├── 📄 admin.html
│   ├── 📄 history.html
│   ├── 📂 css/
│   │   └── style.css
│   └── 📂 js/
│       └── app.js
├── 📄 .gitignore
└── 📄 README.md
## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/feedback` | Submit feedback (users) |
| POST | `/api/feedback/guest` | Submit feedback (guests) |
| GET | `/api/admin/feedbacks` | Get all feedbacks (admin) |

## 🎯 Usage

### For Users
1. **Register/Login** to your account
2. **Submit feedback** on products/services
3. **View personal feedback history**

### For Administrators  
1. **Access dashboard** with admin credentials
2. **Monitor real-time analytics**
3. **View sentiment trends** and user engagement

## 🏗️ Architecture

```
User → Frontend → Node.js/Express → MongoDB
                     ↓
              Sentiment Analysis
                     ↓
            Admin Dashboard ← Chart.js
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nishad Ruhee** 
- GitHub: [@Nishadruhe](https://github.com/Nishadruhe)

## 🙏 Acknowledgments

- TCS for project guidelines
- Open source community
- MongoDB for database solutions

---

**⭐ If you find this project helpful, please give it a star!**

---

<div align="center">

### Built with ❤️ using Modern Web Technologies

</div>
