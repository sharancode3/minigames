// server.js - Game Portal Backend Server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// In-memory database (replace with real database in production)
const users = [];
const gameProgress = []; // { userId, gameId, score, timestamp, stats }

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ===== AUTH ROUTES =====

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(user);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  });
});

// ===== GAME PROGRESS ROUTES =====

// Save Game Progress
app.post('/api/progress', authenticateToken, (req, res) => {
  try {
    const { gameId, score, stats, result } = req.body;

    const progress = {
      id: 'progress_' + Date.now(),
      userId: req.user.id,
      gameId,
      score,
      stats,
      result,
      timestamp: new Date().toISOString()
    };

    gameProgress.push(progress);

    res.status(201).json({
      message: 'Progress saved',
      progress
    });
  } catch (error) {
    console.error('Progress save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Progress for a specific game
app.get('/api/progress/:gameId', authenticateToken, (req, res) => {
  const { gameId } = req.params;
  const userProgress = gameProgress.filter(
    p => p.userId === req.user.id && p.gameId === gameId
  );

  // Calculate stats
  const stats = {
    totalGames: userProgress.length,
    bestScore: userProgress.length > 0 ? Math.max(...userProgress.map(p => p.score || 0)) : 0,
    averageScore: userProgress.length > 0 
      ? userProgress.reduce((sum, p) => sum + (p.score || 0), 0) / userProgress.length 
      : 0,
    recentGames: userProgress.slice(-10).reverse()
  };

  res.json(stats);
});

// Get All User Progress
app.get('/api/progress', authenticateToken, (req, res) => {
  const userProgress = gameProgress.filter(p => p.userId === req.user.id);
  
  // Group by game
  const byGame = {};
  userProgress.forEach(p => {
    if (!byGame[p.gameId]) {
      byGame[p.gameId] = [];
    }
    byGame[p.gameId].push(p);
  });

  // Calculate stats per game
  const stats = Object.keys(byGame).map(gameId => ({
    gameId,
    totalGames: byGame[gameId].length,
    bestScore: Math.max(...byGame[gameId].map(p => p.score || 0)),
    averageScore: byGame[gameId].reduce((sum, p) => sum + (p.score || 0), 0) / byGame[gameId].length,
    lastPlayed: byGame[gameId][byGame[gameId].length - 1].timestamp
  }));

  res.json({
    totalGames: userProgress.length,
    games: stats
  });
});

// Get Leaderboard for a game
app.get('/api/leaderboard/:gameId', (req, res) => {
  const { gameId } = req.params;
  
  // Get best score per user for this game
  const userBestScores = {};
  gameProgress
    .filter(p => p.gameId === gameId)
    .forEach(p => {
      if (!userBestScores[p.userId] || p.score > userBestScores[p.userId].score) {
        userBestScores[p.userId] = p;
      }
    });

  // Convert to array and add user info
  const leaderboard = Object.values(userBestScores)
    .map(p => {
      const user = users.find(u => u.id === p.userId);
      return {
        username: user ? user.username : 'Unknown',
        score: p.score,
        timestamp: p.timestamp
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10

  res.json(leaderboard);
});

// ===== SERVER START =====

app.listen(PORT, () => {
  console.log(`🎮 Game Portal Server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to track game progress and authenticate users`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    users: users.length,
    progressRecords: gameProgress.length 
  });
});
