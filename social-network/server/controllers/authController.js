const jwt = require('jsonwebtoken');
const User = require('../models/User');
const moodleService = require('../services/moodleService');
const twoFactorService = require('../services/twoFactorService');

// Generate JWT token
const generateToken = (userId, requireTwoFactor = false) => {
  return jwt.sign(
    { userId, requireTwoFactor },
    process.env.JWT_SECRET,
    { expiresIn: requireTwoFactor ? '5m' : (process.env.JWT_EXPIRES_IN || '7d') }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Validate role - only allow certain roles during self-registration
    // Admin and moderator roles must be assigned by an admin
    const allowedRoles = ['user', 'student', 'instructor'];
    const userRole = role && allowedRoles.includes(role) ? role : 'user';

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: userRole
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Generate a temporary token that requires 2FA verification
      const tempToken = generateToken(user._id, true);
      
      return res.json({
        success: true,
        requireTwoFactor: true,
        data: {
          tempToken,
          message: 'Please enter your 2FA code'
        }
      });
    }

    // Generate full access token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username avatar firstName lastName')
      .populate('following', 'username avatar firstName lastName');

    res.json({
      success: true,
      data: user.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Link Moodle account
// @route   POST /api/auth/link-moodle
// @access  Private
exports.linkMoodle = async (req, res) => {
  try {
    const { moodleUsername, moodlePassword } = req.body;

    // Authenticate with Moodle
    const moodleAuth = await moodleService.authenticateUser(
      moodleUsername, 
      moodlePassword
    );

    if (!moodleAuth.token) {
      return res.status(400).json({
        success: false,
        message: 'Failed to authenticate with Moodle'
      });
    }

    // Get Moodle user info
    const siteInfo = await moodleService.getSiteInfo(moodleAuth.token);

    // Update user with Moodle data
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        moodleUserId: siteInfo.userid,
        moodleToken: moodleAuth.token,
        moodleLinked: true
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Moodle account linked successfully',
      data: {
        moodleUserId: siteInfo.userid,
        moodleUsername: siteInfo.username,
        moodleFullname: siteInfo.fullname
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to link Moodle account'
    });
  }
};

// @desc    Unlink Moodle account
// @route   POST /api/auth/unlink-moodle
// @access  Private
exports.unlinkMoodle = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      moodleUserId: null,
      moodleToken: null,
      moodleLinked: false
    });

    res.json({
      success: true,
      message: 'Moodle account unlinked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
exports.refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Setup 2FA - Generate secret and QR code
// @route   POST /api/auth/2fa/setup
// @access  Private
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    // Generate secret
    const secret = twoFactorService.generateSecret();
    
    // Generate OTP Auth URL
    const otpauthURL = twoFactorService.generateQRCodeURL(secret, user.email);
    
    // Generate QR code image URL
    const qrCodeURL = twoFactorService.getQRCodeImageURL(otpauthURL);

    // Save secret temporarily (not enabled yet)
    user.twoFactorSecret = secret;
    await user.save();

    res.json({
      success: true,
      data: {
        secret,
        qrCodeURL,
        otpauthURL,
        message: 'Scan the QR code with your authenticator app, then verify with a code'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Enable 2FA - Verify code and enable
// @route   POST /api/auth/2fa/enable
// @access  Private
exports.enable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please setup 2FA first'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    // Verify the code
    const isValid = twoFactorService.verifyTOTP(user.twoFactorSecret, code);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Generate backup codes
    const backupCodes = twoFactorService.generateBackupCodes();

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        backupCodes: backupCodes.map(bc => bc.code),
        message: 'Save these backup codes in a safe place. Each code can only be used once.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
  try {
    const { password, code } = req.body;
    const user = await User.findById(req.user._id).select('+password +twoFactorSecret');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify 2FA code
    const isCodeValid = twoFactorService.verifyTOTP(user.twoFactorSecret, code);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify 2FA code during login
// @route   POST /api/auth/2fa/verify
// @access  Public (with temp token)
exports.verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    if (!decoded.requireTwoFactor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await User.findById(decoded.userId).select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Try TOTP verification first
    let isValid = twoFactorService.verifyTOTP(user.twoFactorSecret, code);
    
    // If TOTP fails, try backup code
    if (!isValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      const backupResult = twoFactorService.verifyBackupCode(user.twoFactorBackupCodes, code);
      
      if (backupResult.valid) {
        // Mark backup code as used
        user.twoFactorBackupCodes[backupResult.index].used = true;
        await user.save();
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Generate full access token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get 2FA status
// @route   GET /api/auth/2fa/status
// @access  Private
exports.get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorBackupCodes');

    const unusedBackupCodes = user.twoFactorBackupCodes 
      ? user.twoFactorBackupCodes.filter(bc => !bc.used).length 
      : 0;

    res.json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
        backupCodesRemaining: unusedBackupCodes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Regenerate backup codes
// @route   POST /api/auth/2fa/backup-codes
// @access  Private
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const { password, code } = req.body;
    const user = await User.findById(req.user._id).select('+password +twoFactorSecret');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify 2FA code
    const isCodeValid = twoFactorService.verifyTOTP(user.twoFactorSecret, code);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }

    // Generate new backup codes
    const backupCodes = twoFactorService.generateBackupCodes();
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: backupCodes.map(bc => bc.code)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
