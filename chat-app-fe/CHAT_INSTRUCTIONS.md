# Chat App Frontend

This is a React + TypeScript frontend for the WebSocket chat application.

## Features

### 🏛️ **Public Room**
- Single shared room for all users
- Anyone can join and chat
- Real-time messaging

### 🔒 **Private Rooms**
- Create new private rooms with random 6-character codes
- Join existing private rooms with room code
- Isolated conversations

### 💬 **Chat Features**
- Real-time messaging
- Message history
- Timestamps
- User identification
- Auto-scroll to new messages

## How to Use

### 1. **Start the Application**
```bash
npm run dev
```

### 2. **Connect to WebSocket Server**
- Make sure your backend server is running on `ws://localhost:8080`
- Click "Connect" button
- Connection status indicator shows current state

### 3. **Join a Room**

#### **Public Room:**
1. Enter your username
2. Select "Public Room"
3. Click "Join Public Room"

#### **Private Room - Create New:**
1. Enter your username
2. Select "Private Room"
3. Choose "Create New Room"
4. Click "Create Private Room"
5. Share the generated room code with others

#### **Private Room - Join Existing:**
1. Enter your username
2. Select "Private Room"
3. Choose "Join Existing Room"
4. Enter the room code (e.g., A1B2C3)
5. Click "Join Private Room"

### 4. **Send Messages**
- Type your message in the input field
- Press Enter or click "Send"
- Your message appears immediately
- Others see it in real-time

### 5. **Leave Room**
- Click "Leave Room" to return to room selection
- Click "Disconnect" to close WebSocket connection

## Message Flow

### **Public Room Messages**
```json
// Join Public Room
{
  "roomType": "public",
  "type": "join",
  "payload": {
    "username": "john_doe"
  }
}

// Send Message in Public Room
{
  "roomType": "public",
  "type": "chat",
  "payload": {
    "message": "Hello everyone!"
  }
}
```

### **Private Room Messages**
```json
// Create Private Room
{
  "roomType": "private",
  "type": "join",
  "gencode": true,
  "payload": {
    "username": "alice_smith"
  }
}

// Join Existing Private Room
{
  "roomType": "private",
  "type": "join",
  "gencode": false,
  "payload": {
    "roomId": "A1B2C3",
    "username": "bob_wilson"
  }
}

// Send Message in Private Room
{
  "roomType": "private",
  "type": "chat",
  "payload": {
    "roomId": "A1B2C3",
    "message": "Private message here!"
  }
}
```

## Error Handling

The app handles various error scenarios:
- Connection failures
- Invalid room codes
- Missing usernames
- Malformed messages
- Server disconnections

## UI Features

- **Dark Theme**: Modern dark gray design
- **Responsive**: Works on desktop and mobile
- **Real-time Updates**: Instant message delivery
- **Visual Feedback**: Connection status, error messages
- **Keyboard Shortcuts**: Enter to send/join
- **Auto-scroll**: Automatically scrolls to new messages

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tool
- **Tailwind CSS** for styling
- **WebSocket API** for real-time communication

## Development

### **Project Structure**
```
src/
├── App.tsx          # Main chat component
├── App.css          # Custom styles
├── main.tsx         # React entry point
└── index.css        # Global styles
```

### **Key Components**
- Connection management
- Room selection UI
- Message display
- Input handling
- Error display
- Real-time WebSocket communication

Perfect match with your backend API! 🚀
