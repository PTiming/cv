/**
 * Script to create an admin account
 * 
 * Usage:
 *   node scripts/createAdmin.js
 *   
 * Or with custom credentials:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepass123 node scripts/createAdmin.js
 * 
 * Environment variables:
 *   ADMIN_FIRST_NAME - Admin's first name (default: "Admin")
 *   ADMIN_LAST_NAME  - Admin's last name (default: "User")
 *   ADMIN_USERNAME   - Admin's username (default: "admin")
 *   ADMIN_EMAIL      - Admin's email (default: "admin@localhost.com")
 *   ADMIN_PASSWORD   - Admin's password (default: "admin123456")
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Import User model
const User = require('../models/User');

// Default admin credentials (can be overridden via environment variables)
const DEFAULT_ADMIN = {
  firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
  lastName: process.env.ADMIN_LAST_NAME || 'User',
  username: process.env.ADMIN_USERNAME || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@localhost.com',
  password: process.env.ADMIN_PASSWORD || 'admin123456',
  role: 'admin'
};

// Create readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function createAdmin(adminData, interactive = false) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      console.log('   Please set MONGODB_URI in your .env file');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('\n⚠️  An admin account already exists with this email/username:');
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Username: ${existingAdmin.username}`);
        console.log(`   Role: ${existingAdmin.role}`);
        
        if (interactive) {
          const answer = await question('\nDo you want to create another admin? (y/n): ');
          if (answer.toLowerCase() !== 'y') {
            console.log('👋 Exiting...');
            process.exit(0);
          }
          // Generate unique username/email
          const timestamp = Date.now();
          adminData.username = `admin_${timestamp}`;
          adminData.email = `admin_${timestamp}@localhost.com`;
          console.log(`\n📝 Using new credentials: ${adminData.username} / ${adminData.email}`);
        } else {
          console.log('\n💡 To create another admin, use different email/username');
          process.exit(0);
        }
      } else {
        // User exists but not admin - upgrade to admin
        console.log(`\n📝 User exists with role '${existingAdmin.role}'. Upgrading to admin...`);
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ User upgraded to admin successfully!');
        console.log('\n🔐 Admin Account Details:');
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Username: ${existingAdmin.username}`);
        console.log(`   Role: admin`);
        process.exit(0);
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = new User({
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    await admin.save();

    console.log('\n✅ Admin account created successfully!\n');
    console.log('🔐 Admin Account Details:');
    console.log('   ═══════════════════════════════════════');
    console.log(`   First Name: ${adminData.firstName}`);
    console.log(`   Last Name:  ${adminData.lastName}`);
    console.log(`   Username:   ${adminData.username}`);
    console.log(`   Email:      ${adminData.email}`);
    console.log(`   Password:   ${adminData.password}`);
    console.log(`   Role:       admin`);
    console.log('   ═══════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT: Change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.log('   A user with this email or username already exists');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

async function interactiveMode() {
  console.log('\n🔧 Create Admin Account - Interactive Mode\n');
  
  const adminData = {
    firstName: await question(`First Name (${DEFAULT_ADMIN.firstName}): `) || DEFAULT_ADMIN.firstName,
    lastName: await question(`Last Name (${DEFAULT_ADMIN.lastName}): `) || DEFAULT_ADMIN.lastName,
    username: await question(`Username (${DEFAULT_ADMIN.username}): `) || DEFAULT_ADMIN.username,
    email: await question(`Email (${DEFAULT_ADMIN.email}): `) || DEFAULT_ADMIN.email,
    password: await question(`Password (${DEFAULT_ADMIN.password}): `) || DEFAULT_ADMIN.password
  };

  console.log('\n📋 Review Admin Details:');
  console.log(`   First Name: ${adminData.firstName}`);
  console.log(`   Last Name:  ${adminData.lastName}`);
  console.log(`   Username:   ${adminData.username}`);
  console.log(`   Email:      ${adminData.email}`);
  console.log(`   Password:   ${'*'.repeat(adminData.password.length)}`);

  const confirm = await question('\nCreate this admin account? (y/n): ');
  if (confirm.toLowerCase() === 'y') {
    await createAdmin(adminData, true);
  } else {
    console.log('👋 Cancelled. Exiting...');
    process.exit(0);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--interactive') || args.includes('-i')) {
  interactiveMode();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📖 Create Admin Account Script

Usage:
  node scripts/createAdmin.js [options]

Options:
  -i, --interactive    Run in interactive mode (prompts for input)
  -h, --help           Show this help message

Environment Variables:
  ADMIN_FIRST_NAME     Admin's first name (default: "Admin")
  ADMIN_LAST_NAME      Admin's last name (default: "User")
  ADMIN_USERNAME       Admin's username (default: "admin")
  ADMIN_EMAIL          Admin's email (default: "admin@localhost.com")
  ADMIN_PASSWORD       Admin's password (default: "admin123456")

Examples:
  # Create admin with defaults
  node scripts/createAdmin.js

  # Create admin interactively
  node scripts/createAdmin.js -i

  # Create admin with custom credentials
  ADMIN_EMAIL=admin@mysite.com ADMIN_PASSWORD=MySecurePass123 node scripts/createAdmin.js
`);
  process.exit(0);
} else {
  // Run with defaults or environment variables
  createAdmin(DEFAULT_ADMIN, false);
}
