# DigiVendors - Local Marketplace App

A full-stack React Native e-commerce application connecting local buyers and sellers, built with Node.js backend and MongoDB database.

## 🚀 Features

### For Buyers
- Browse local products by category
- Search and filter products
- View detailed product information
- Contact sellers directly
- Manage delivery addresses
- Secure payment processing
- Order tracking and history

### For Sellers
- Product management (add, edit, delete)
- Inventory tracking
- Order management
- Business location management
- Sales dashboard and analytics
- Customer communication

### General Features
- User authentication (login/register)
- Role-based access (buyer/seller)
- Real-time location services
- Image upload and management
- Responsive design
- Cross-platform compatibility (iOS/Android)

## 🛠️ Tech Stack

### Frontend (React Native)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Zustand
- **UI Components**: Custom components with React Native Elements
- **Image Handling**: Expo ImagePicker
- **Storage**: AsyncStorage
- **Maps Integration**: Google Maps API

### Backend (Node.js)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary
- **Validation**: Express Validator
- **Security**: bcryptjs for password hashing

## 📁 Project Structure

```
DigiVendors/
├── frontend/                 # React Native app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── screens/          # App screens
│   │   ├── navigation/       # Navigation configuration
│   │   ├── stores/           # Zustand state management
│   │   ├── services/        # API services
│   │   ├── constants/       # App constants
│   │   └── utils/            # Utility functions
│   ├── assets/               # Images and static files
│   └── package.json
├── backend/                  # Node.js API server
│   ├── config/               # Database and service configs
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoints
│   ├── middleware/           # Custom middleware
│   ├── .env                  # Environment variables
│   └── server.js             # Entry point
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Expo CLI
- Android Studio/Xcode (for device testing)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/digivendors
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Expo development server**
   ```bash
   npx expo start
   ```

4. **Run on device/emulator**
   - Scan QR code with Expo Go app (mobile)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## 📱 App Screens

### Authentication
- **LoginScreen**: User login with email/password
- **RegisterScreen**: New user registration with role selection

### Buyer Screens
- **HomeScreen**: Product browsing and search
- **ProductDetailScreen**: Detailed product view
- **SearchScreen**: Advanced product search
- **LocalVendorsScreen**: Browse local sellers
- **BuyerLocationScreen**: Manage delivery addresses
- **PaymentScreen**: Secure checkout process
- **OrdersScreen**: Order history and tracking

### Seller Screens
- **SellerDashboardScreen**: Sales overview and analytics
- **SellerProductsScreen**: Product inventory management
- **AddProductScreen**: Add new products
- **SellerLocationScreen**: Business location management

### Shared Screens
- **ProfileScreen**: User profile management

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Users
- `GET /api/users/sellers` - Get all sellers
- `PUT /api/users/profile` - Update user profile

## 🎨 Design System

### Colors
- Primary: `#FF6B35` (Orange)
- Secondary: `#2E8B57` (Sea Green)
- Background: `#F5F5F5` (Light Gray)
- Text: `#333333` (Dark Gray)
- White: `#FFFFFF`
- Border: `#E0E0E0`

### Typography
- Headers: Bold, 18-24px
- Body: Regular, 14-16px
- Captions: Regular, 12px

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- Protected routes and middleware
- Secure file upload handling

## 📦 Key Dependencies

### Frontend
- `react-native`: Core framework
- `expo`: Development platform
- `@react-navigation/native`: Navigation
- `zustand`: State management
- `@react-native-async-storage/async-storage`: Local storage
- `expo-image-picker`: Image selection

### Backend
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password hashing
- `cloudinary`: Image upload service
- `express-validator`: Input validation

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use local MongoDB
2. Configure environment variables for production
3. Deploy to services like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the app using Expo Build Service (EAS)
2. Generate APK/IPA files for distribution
3. Publish to Google Play Store / Apple App Store

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
