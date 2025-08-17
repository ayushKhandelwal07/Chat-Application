  # Chat Application

A real-time chat application built with TypeScript, featuring both public and private rooms with WebSocket communication.

##  Project Structure

```
chat-app/
├── chat-app-be/          # Backend (Node.js + WebSocket)
│   ├── src/
│   │   └── index.ts      # WebSocket server implementation
│   ├── package.json
│   └── tsconfig.json
├── chat-app-fe/          # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx       # Main application component
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
│   ├── package.json
│   └── vite.config.ts
└── README.md            # This file
```

## Tech Stack

### Backend
- **Node.js** with TypeScript
- **WebSocket (ws)** for real-time communication
- **Crypto** for generating room codes

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## How to Use

### Public Room
1. Enter your username
2. Select "Public" room type
3. Click "Join Public Room"
4. Start chatting with all connected users

### Private Room

**Create a new room:**
1. Enter your username
2. Select "Private" room type
3. Choose "Create" option
4. Click "Create Private Room"
5. Share the generated room code with others

**Join an existing room:**
1. Enter your username
2. Select "Private" room type
3. Choose "Join" option
4. Enter the room code (e.g., A1B2C3)
5. Click "Join Private Room"

## 🔧 API Reference

### WebSocket Messages

#### Join Public Room
```json
{
  "roomType": "public",
  "type": "join",
  "payload": {
    "username": "alice"
  }
}
```

#### Create Private Room
```json
{
  "roomType": "private",
  "type": "join",
  "gencode": true,
  "payload": {
    "username": "alice"
  }
}
```

#### Join Private Room
```json
{
  "roomType": "private",
  "type": "join",
  "gencode": false,
  "payload": {
    "roomId": "A1B2C3",
    "username": "alice"
  }
}
```

#### Send Message
```json
{
  "roomType": "public",
  "type": "chat",
  "payload": {
    "message": "Hello world!"
  }
}
```

### Server Responses

#### Join Confirmation
```json
{
  "type": "joinConfirmation",
  "roomType": "public",
  "payload": {
    "username": "alice",
    "timestamp": 1692123456789
  }
}
```

#### Room Created
```json
{
  "type": "roomCreated",
  "roomType": "private",
  "payload": {
    "roomCode": "A1B2C3",
    "username": "alice",
    "timestamp": 1692123456789
  }
}
```

#### Chat Message
```json
{
  "type": "chat",
  "roomType": "public",
  "payload": {
    "message": "Hello world!",
    "sender": "alice",
    "timestamp": 1692123456789
  }
}
```
## Screenshots

<img width="1920" height="1033" alt="image" src="https://github.com/user-attachments/assets/cab17170-5525-4de0-81d5-e774c3b86cbe" />
<img width="1920" height="975" alt="image" src="https://github.com/user-attachments/assets/6b030bb7-5fc3-4a4b-bb20-48e9c695b7ad" />
<img width="1920" height="1034" alt="image" src="https://github.com/user-attachments/assets/7f7a6d03-f122-4f5e-84a0-dc79f9bc5162" />
<img width="1920" height="1033" alt="image" src="https://github.com/user-attachments/assets/e972a51e-0a2e-4122-8bdb-e3a769d7c3cf" />


![alt text](image-1.png)

![alt text](image-2.png)
