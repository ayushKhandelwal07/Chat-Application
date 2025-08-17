import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Users, 
  Lock, 
  Globe, 
  Send, 
  LogOut,
  User,
  Hash,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import './App.css';

// Message types matching your backend
interface Message {
  content: string;
  sender: string;
  timestamp: number;
}

interface ChatMessage {
  type: 'chat';
  roomType: 'public' | 'private';
  payload: {
    message: string;
    sender: string;
    timestamp: number;
    roomId?: string;
  };
}

interface JoinConfirmation {
  type: 'joinConfirmation';
  roomType: 'public' | 'private';
  payload: {
    username: string;
    timestamp: number;
    roomId?: string;
  };
}

interface RoomCreated {
  type: 'roomCreated';
  roomType: 'private';
  payload: {
    roomCode: string;
    username: string;
    timestamp: number;
  };
}

interface ErrorMessage {
  type: 'error' | 'err';
  message: string;
}

type WebSocketMessage = ChatMessage | JoinConfirmation | RoomCreated | ErrorMessage;

function App() {
  const { theme, toggleTheme } = useTheme();
  const [ws, setWs] = useState<WebSocket | null>(null); // WebSocket instance or null
  

  const [connected, setConnected] = useState(false); // true/false
  const [username, setUsername] = useState(''); // "alice", "john123"
  const [roomType, setRoomType] = useState<'public' | 'private'>('public'); // 'public' or 'private'
  const [roomId, setRoomId] = useState(''); // "A1B2C3", ""
  const [messages, setMessages] = useState<Message[]>([]); // [{content, sender, timestamp}, ...]
  const [newMessage, setNewMessage] = useState(''); // "hello world", ""
  const [joinedRoom, setJoinedRoom] = useState(false); // true/false
  const [error, setError] = useState(''); // "Please enter username", ""
  const [isCreatingRoom, setIsCreatingRoom] = useState(false); // true/false
  const [isConnecting, setIsConnecting] = useState(false); // true/false
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      console.log('Received:', data);

      switch (data.type) {
        case 'chat': {
          const chatMsg: Message = {
            content: data.payload.message, 
            sender: data.payload.sender,   
            timestamp: data.payload.timestamp
          };
          setMessages(prev => [...prev, chatMsg]); 
          break;
        }

        case 'joinConfirmation': {
          setJoinedRoom(true); // enable chat
          if (data.roomType === 'private' && data.payload.roomId) {
            setRoomId(data.payload.roomId); 
          }
          setError(''); 
          setIsConnecting(false); // control loading
          break;
        }

        case 'roomCreated': {
          setJoinedRoom(true); // enable chat
          setRoomId(data.payload.roomCode); 
          setError(''); 
          setIsConnecting(false); // stop loading
          break;
        }

        case 'error':
        case 'err': {
          setError(data.message); 
          setIsConnecting(false);
          break;
        }

        default:
          console.log('Unknown message type:', data);
      }
    } catch (err) {
      console.error('Error parsing message:', err);
      setIsConnecting(false); // stop loading
    }
  };

  const joinRoom = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsConnecting(true); // show loading
    setError(''); 

    if (!connected || !ws) {
      const websocket = new WebSocket('ws://localhost:8080');
      
      websocket.onopen = () => {
        setConnected(true); // mark connected
        setError(''); 
        console.log('Connected to WebSocket server');
        performJoinRoom(websocket);
      };

      websocket.onmessage = (event) => {
        handleWebSocketMessage(event);
      };

      websocket.onclose = () => {
        setConnected(false); // mark disconnected
        setJoinedRoom(false); // exit chat
        setRoomId(''); // clear room
        setIsConnecting(false); // stop loading
        console.log('Disconnected from WebSocket server');
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
        setIsConnecting(false); // stop loading
      };

      setWs(websocket); // store instance
    } else {
      performJoinRoom(ws);
    }
  };

  const performJoinRoom = (websocket: WebSocket) => {
    setMessages([]); 
    setError(''); 

    if (roomType === 'public') {
      const joinMessage = {
        roomType: 'public',
        type: 'join',
        payload: {
          username: username.trim() 
        }
      };
      websocket.send(JSON.stringify(joinMessage));
    } else {
      if (isCreatingRoom) {
        const createMessage = {
          roomType: 'private',
          type: 'join',
          gencode: true, // generate new code
          payload: {
            username: username.trim() 
          }
        };
        websocket.send(JSON.stringify(createMessage));
      } else {
        if (!roomId.trim()) {
          setError('Please enter a room code');
          setIsConnecting(false); // stop loading
          return;
        }
        const joinMessage = {
          roomType: 'private',
          type: 'join',
          gencode: false, // join existing
          payload: {
            roomId: roomId.trim().toUpperCase(),
            username: username.trim() 
          }
        };
        websocket.send(JSON.stringify(joinMessage));
      }
    }
  };

  const sendMessage = () => {
    if (!ws || !newMessage.trim() || !joinedRoom) {
      return;
    }

    if (roomType === 'public') {
      const chatMessage = {
        roomType: 'public',
        type: 'chat',
        payload: {
          message: newMessage.trim()
        }
      };
      ws.send(JSON.stringify(chatMessage));
    } else {
      if (!roomId) {
        setError('No room selected'); 
        return;
      }
      const chatMessage = {
        roomType: 'private',
        type: 'chat',
        payload: {
          roomId: roomId, 
          message: newMessage.trim() 
        }
      };
      ws.send(JSON.stringify(chatMessage));
    }

    const localMessage: Message = {
      content: newMessage.trim(), 
      sender: username, 
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, localMessage]);
    setNewMessage(''); 
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (joinedRoom) {
        sendMessage();
      } else {
        joinRoom();
      }
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const leaveRoom = () => {
    setJoinedRoom(false); 
    setRoomId(''); 
    setMessages([]); 
    setError(''); 
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full shadow-lg"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="h-8 w-8 text-foreground" />
            <h1 className="text-4xl font-bold text-foreground">
              ChatRooms
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Connect instantly with real-time messaging
          </p>
        </div>

        {!joinedRoom ? (
          /* Join Room Form */
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                Join a Room
              </CardTitle>
              <CardDescription>
                Enter your details to start chatting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your username"
                  disabled={isConnecting}
                />
              </div>

              <Separator />

              {/* Room Type Selection */}
              <div className="space-y-3">
                <Label>Room Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={roomType === 'public' ? 'default' : 'outline'}
                    onClick={() => setRoomType('public')} // set to 'public'
                    className="justify-start gap-2 h-auto p-4"
                    disabled={isConnecting}
                  >
                    <Globe className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Public</div>
                      <div className="text-xs opacity-80">Join everyone</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={roomType === 'private' ? 'default' : 'outline'}
                    onClick={() => setRoomType('private')} // set to 'private'
                    className="justify-start gap-2 h-auto p-4"
                    disabled={isConnecting}
                  >
                    <Lock className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Private</div>
                      <div className="text-xs opacity-80">Invite only</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Private Room Options */}
              {roomType === 'private' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={isCreatingRoom ? 'default' : 'outline'}
                      onClick={() => setIsCreatingRoom(true)} // set to create mode
                      className="justify-start gap-2 h-auto p-3"
                      disabled={isConnecting}
                    >
                      <Plus className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Create</div>
                        <div className="text-xs opacity-80">New room</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={!isCreatingRoom ? 'default' : 'outline'}
                      onClick={() => setIsCreatingRoom(false)} // set to join mode
                      className="justify-start gap-2 h-auto p-3"
                      disabled={isConnecting}
                    >
                      <Hash className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Join</div>
                        <div className="text-xs opacity-80">With code</div>
                      </div>
                    </Button>
                  </div>
                  
                  {!isCreatingRoom && (
                    <div className="space-y-2">
                      <Label htmlFor="roomId">Room Code</Label>
                      <Input
                        id="roomId"
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())} // set to uppercase
                        onKeyPress={handleKeyPress}
                        className="font-mono"
                        placeholder="Enter room code (e.g., A1B2C3)"
                        disabled={isConnecting}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Join Button */}
              <Button
                onClick={joinRoom}
                disabled={!username.trim() || (roomType === 'private' && !isCreatingRoom && !roomId.trim()) || isConnecting}
                className="w-full font-medium py-3"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    {roomType === 'public' ? (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Join Public Room
                      </>
                    ) : isCreatingRoom ? (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Private Room
                      </>
                    ) : (
                      <>
                        <Hash className="h-4 w-4 mr-2" />
                        Join Private Room
                      </>
                    )}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Chat Interface */
          <Card className="overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="bg-primary text-primary-foreground">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {roomType === 'public' ? (
                      <Globe className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {roomType === 'public' ? 'Public Room' : `Room: ${roomId}`}
                      </CardTitle>
                      <CardDescription className="text-primary-foreground/80 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {username}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Online
                  </Badge>
                </div>
                <Button
                  onClick={leaveRoom}
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Leave
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="p-0">
              <ScrollArea className="h-96 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg font-medium">No messages yet</p>
                    <p className="text-muted-foreground/60 text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${msg.sender === username ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs font-medium ${
                            msg.sender === username 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {getInitials(msg.sender)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col max-w-xs lg:max-w-md ${
                          msg.sender === username ? 'items-end' : 'items-start'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-medium">
                              {msg.sender}
                            </span>
                            <span className="text-xs text-muted-foreground/60">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              msg.sender === username
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4 bg-muted/30">
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)} // update input
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  placeholder="Type your message..."
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
