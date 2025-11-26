# 🎮 Game Portal

A modern gaming platform similar to Poki, featuring multiple games with user authentication and progress tracking. Built with a stunning red/black contrasting color scheme.

## 🌟 Features

- **User Authentication**: Secure login/signup system with JWT tokens
- **Progress Tracking**: All game scores and stats are automatically saved
- **6 Built-in Games**:
  - 🐍 Crazy Snake - Classic snake game
  - 👻 Haunted Calculator - Spooky puzzle game
  - 🏓 Ping Pong - Play against AI
  - 🦖 Dino Run - Chrome dino-style runner
  - 💭 Word Guesser - Hangman-style word game
  - ⚡ Reaction Time - Test your reflexes

- **Modern UI**: Sleek red/black design with smooth animations
- **Real-time Search**: Filter games instantly
- **Offline Support**: Works without backend connection
- **Minimizable Player**: Play games in floating window
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Start the backend server:**
   ```powershell
   npm start
   ```
   Server will run on `http://localhost:3000`

3. **Open the application:**
   - Open `index.html` in your browser, or
   - Use a local server like Live Server (VS Code extension)

### Using Live Server (Recommended)

If you have the Live Server extension in VS Code:
1. Right-click on `index.html`
2. Select "Open with Live Server"
3. The app will open at `http://127.0.0.1:5500` (or similar)

## 📁 Project Structure

```
game-portal/
├── index.html              # Main portal page
├── login.html             # Authentication page
├── login.css              # Login page styles
├── login.js               # Login logic
├── portal.app.js          # Main application logic
├── portal.style.css       # Main styles
├── server.js              # Backend server
├── package.json           # Dependencies
├── .env                   # Environment variables
│
└── games/                 # Individual game folders
    ├── snake/
    │   └── index.html
    ├── haunted/
    │   ├── index.html
    │   ├── cj.js
    │   └── csy.css
    ├── pingpong/
    │   └── index.html
    ├── dino/
    │   └── index.html
    ├── wordguesser/
    │   └── index.html
    └── reactiontime/
        └── index.html
```

## 🎯 How to Use

### First Time Setup

1. Open the application (it will redirect to login page)
2. Click "Sign Up" tab
3. Create an account with username, email, and password
4. You'll be automatically logged in

### Playing Games

1. Browse the game grid on the main page
2. Use the search bar to filter games
3. Click "Play" on any game to launch it
4. Your progress is automatically saved
5. Games can be minimized while playing

### Guest Mode

- Click "Continue as Guest" on login page
- Progress won't be saved to server
- Local storage will be used instead

## � Configuration

### Backend Settings

Edit `.env` file to configure:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Adding New Games

1. Create a new folder in `games/` directory
2. Add your game's `index.html` and assets
3. Update `GAMES` array in `portal.app.js`:

```javascript
const GAMES = [
  // ... existing games
  { 
    id:'your-game', 
    title:'Your Game Title', 
    category:'Category', 
    embed:'./games/your-game/index.html' 
  }
];
```

4. Send game over message from your game:

```javascript
window.parent.postMessage({
  type: 'game_over',
  gameId: 'your-game',
  result: 'won', // or 'lost'
  score: 1000
}, '*');
```

## 🎨 Customization

### Changing Colors

Edit CSS variables in `portal.style.css`:

```css
:root {
  --bg-1: #0a0000;
  --bg-2: #1a0505;
  --accent: #ff0000;
  --accent-2: #ff3333;
  --muted: #ff6b6b;
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Progress Tracking
- `POST /api/progress` - Save game progress
- `GET /api/progress/:gameId` - Get progress for specific game
- `GET /api/progress` - Get all user progress
- `GET /api/leaderboard/:gameId` - Get game leaderboard

## � Security Notes

⚠️ **Important for Production:**
- Change the `JWT_SECRET` in `.env`
- Use a real database (MongoDB, PostgreSQL, etc.)
- Add HTTPS
- Implement rate limiting
- Add input validation
- Hash passwords properly (already using bcrypt)

## 🐛 Troubleshooting

### Server won't start
- Make sure port 3000 is not in use
- Run `npm install` again
- Check Node.js version

### Games not loading
- Check browser console for errors
- Ensure all game files are in correct folders
- Verify file paths in `GAMES` array

### Progress not saving
- Check if backend server is running
- Verify authentication token is valid
- Check browser console for API errors

## 📝 License

This project is open source and available for personal and educational use.

## 🤝 Contributing

Feel free to add more games or improve existing features!

## � Support

For issues or questions, check the browser console for error messages.

---

**Made with ❤️ for gamers everywhere!**
