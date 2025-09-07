const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ocandle', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Real restaurant/seller data
const sellersData = [
  {
    firstName: 'Marco',
    lastName: 'Rossi',
    email: 'marco@pizzaroma.com',
    password: 'Password123!',
    role: 'seller',
    businessInfo: {
      businessName: 'Pizza Roma',
      businessType: 'restaurant',
      businessDescription: 'Authentic Italian cuisine with traditional recipes'
    },
    phone: '15550101',
    address: {
      street: '123 Little Italy St',
      city: 'New York',
      state: 'NY',
      zipCode: '10013'
    }
  },
  {
    firstName: 'Sakura',
    lastName: 'Tanaka',
    email: 'sakura@sushizen.com',
    password: 'Password123!',
    role: 'seller',
    businessInfo: {
      businessName: 'Sushi Zen',
      businessType: 'restaurant',
      businessDescription: 'Fresh sushi and Japanese cuisine'
    },
    phone: '15550102',
    address: {
      street: '456 Tokyo Ave',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94115'
    }
  },
  {
    firstName: 'Ahmed',
    lastName: 'Hassan',
    email: 'ahmed@spicebazaar.com',
    password: 'Password123!',
    role: 'seller',
    businessInfo: {
      businessName: 'Spice Bazaar',
      businessType: 'restaurant',
      businessDescription: 'Authentic Middle Eastern flavors'
    },
    phone: '15550103',
    address: {
      street: '789 Desert Rd',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001'
    }
  },
  {
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria@tacosfiesta.com',
    password: 'Password123!',
    role: 'seller',
    businessInfo: {
      businessName: 'Tacos Fiesta',
      businessType: 'restaurant',
      businessDescription: 'Traditional Mexican street food'
    },
    phone: '15550104',
    address: {
      street: '321 Cinco de Mayo Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90028'
    }
  },
  {
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma@greenbowl.com',
    password: 'Password123!',
    role: 'seller',
    businessInfo: {
      businessName: 'Green Bowl',
      businessType: 'restaurant',
      businessDescription: 'Healthy organic meals and smoothies'
    },
    phone: '15550107',
    address: {
      street: '147 Organic St',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201'
    }
  }
];

// Real product data with high-quality images
const productsData = [
  // Pizza Roma products
  {
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella, tomato sauce, and basil',
    price: 18.99,
    unit: 'per_piece',
    category: 'bakery',
    stock: {
      quantity: 50,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&h=400&fit=crop',
      publicId: 'margherita_pizza_1',
      isPrimary: true
    }],
    businessName: 'Pizza Roma'
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Traditional pepperoni pizza with mozzarella cheese and spicy pepperoni',
    price: 21.99,
    unit: 'per_piece',
    category: 'bakery',
    stock: {
      quantity: 45,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=400&fit=crop',
      publicId: 'pepperoni_pizza_1',
      isPrimary: true
    }],
    businessName: 'Pizza Roma'
  },
  
  // Sushi Zen products
  {
    name: 'Salmon Sashimi',
    description: 'Fresh Atlantic salmon sliced to perfection, served with wasabi and ginger',
    price: 16.99,
    unit: 'per_piece',
    category: 'seafood',
    stock: {
      quantity: 25,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=400&fit=crop',
      publicId: 'salmon_sashimi_1',
      isPrimary: true
    }],
    businessName: 'Sushi Zen'
  },
  {
    name: 'California Roll',
    description: 'Crab, avocado, and cucumber roll topped with sesame seeds',
    price: 12.99,
    unit: 'per_piece',
    category: 'seafood',
    stock: {
      quantity: 40,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=500&h=400&fit=crop',
      publicId: 'california_roll_1',
      isPrimary: true
    }],
    businessName: 'Sushi Zen'
  },
  
  // Spice Bazaar products
  {
    name: 'Chicken Shawarma',
    description: 'Marinated chicken wrapped in pita with tahini sauce and vegetables',
    price: 14.99,
    unit: 'per_piece',
    category: 'meat',
    stock: {
      quantity: 30,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&h=400&fit=crop',
      publicId: 'chicken_shawarma_1',
      isPrimary: true
    }],
    businessName: 'Spice Bazaar'
  },
  {
    name: 'Falafel Bowl',
    description: 'Crispy falafel with quinoa, fresh vegetables, and tahini dressing',
    price: 13.99,
    unit: 'per_piece',
    category: 'vegetables',
    stock: {
      quantity: 35,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1621852004158-f3bc188ace2d?w=500&h=400&fit=crop',
      publicId: 'falafel_bowl_1',
      isPrimary: true
    }],
    businessName: 'Spice Bazaar'
  },
  
  // Tacos Fiesta products
  {
    name: 'Carnitas Tacos',
    description: 'Slow-cooked pork tacos with onions, cilantro, and lime',
    price: 11.99,
    unit: 'per_piece',
    category: 'meat',
    stock: {
      quantity: 60,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=500&h=400&fit=crop',
      publicId: 'carnitas_tacos_1',
      isPrimary: true
    }],
    businessName: 'Tacos Fiesta'
  },
  {
    name: 'Burrito Bowl',
    description: 'Rice bowl with choice of meat, beans, salsa, and guacamole',
    price: 15.99,
    unit: 'per_piece',
    category: 'grains',
    stock: {
      quantity: 40,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=400&fit=crop',
      publicId: 'burrito_bowl_1',
      isPrimary: true
    }],
    businessName: 'Tacos Fiesta'
  },
  
  // Green Bowl products
  {
    name: 'Quinoa Power Bowl',
    description: 'Quinoa with roasted vegetables, avocado, and tahini dressing',
    price: 14.99,
    unit: 'per_piece',
    category: 'grains',
    stock: {
      quantity: 25,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=400&fit=crop',
      publicId: 'quinoa_bowl_1',
      isPrimary: true
    }],
    businessName: 'Green Bowl'
  },
  {
    name: 'Green Smoothie',
    description: 'Spinach, kale, banana, and mango smoothie with chia seeds',
    price: 8.99,
    unit: 'per_piece',
    category: 'beverages',
    stock: {
      quantity: 50,
      unit: 'pieces'
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&h=400&fit=crop',
      publicId: 'green_smoothie_1',
      isPrimary: true
    }],
    businessName: 'Green Bowl'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await User.deleteMany({ role: 'seller' });
    await Product.deleteMany({});
    console.log('✅ Cleared existing seller and product data');
    
    // Create sellers
    const sellers = [];
    for (const sellerData of sellersData) {
      const hashedPassword = await bcrypt.hash(sellerData.password, 10);
      const seller = new User({
        ...sellerData,
        password: hashedPassword
      });
      await seller.save();
      sellers.push(seller);
      console.log(`✅ Created seller: ${seller.businessInfo.businessName}`);
    }
    
    // Create products and associate with sellers
    for (const productData of productsData) {
      const seller = sellers.find(s => s.businessInfo.businessName === productData.businessName);
      if (seller) {
        const product = new Product({
          ...productData,
          seller: seller._id
        });
        await product.save();
        console.log(`✅ Created product: ${productData.name}`);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${sellers.length} sellers and ${productsData.length} products`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedDatabase();