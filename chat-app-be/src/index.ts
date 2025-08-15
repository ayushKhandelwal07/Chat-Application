import { WebSocket, WebSocketServer } from "ws";
import { randomBytes } from 'crypto';

const wss = new WebSocketServer({port : 8080});

interface Messages {
    content : string;
    sender : string;
}

// interface JoinMessage {
//     type : "join",
//     roomType : "public" | "private", 
//     payload : {
//         user : string;
//         roomId ?: string;
//         createCode ?: boolean;
//     };
// };

// interface JoinChat {
//     roomType : "public | private",
//     type : "chat",
//     payload : {
//         message : string;
//     }
// }

interface RoomData {
    users : Map<WebSocket , string>;  // Map <curr_websocket_of_user && , username>
    messages : Messages[];
    lastActive : number;
    roomType : "public" | "private"; 
}

const rooms = new Map<string | "publicId", RoomData>();  // Map<roomId , roomData>
const users = new Map<WebSocket , string>();           // Map <curr_websocket_of_user && , username>

const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10m
const ROOM_INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30m

function cleanupRooms() {
    const now = Date.now();
    
    rooms.forEach((room, roomId) => {

            const isInactive = (now - room.lastActive) > ROOM_INACTIVE_TIMEOUT;
            const isEmpty = room.users.size === 0;
            
            if (isInactive || isEmpty) {
                console.log(`Cleaning up inactive room: ${roomId}`);
                rooms.delete(roomId);
            } 
    });
    
    console.log(`Cleanup completed. Active rooms: ${rooms.size}, Active users: ${users.size}`);
}

// Start cleanup interval
const cleanupInterval = setInterval(cleanupRooms, CLEANUP_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    clearInterval(cleanupInterval);
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});


wss.on("connection", (socket) => {
    
    socket.on("message", (message : string) => {

    try{

        const data  = JSON.parse(message);


        //all logic for the pubilc room join 
        if(data.roomType === "public"){
            if(data.type === "join"){
                const username = data.payload.username;

                users.set(socket,username);

                if(!rooms.get("publicId")){
                    rooms.set("publicId",{
                        users : new Map([[socket, username]]),
                        messages : [],
                        lastActive : Date.now(),
                        roomType : "public"
                    });
                }else{
                    const publicRoom = rooms.get("publicId")!;
                    publicRoom.users.set(socket, username);
                    publicRoom.lastActive = Date.now();
                }


                socket.send(JSON.stringify({
                    type : "joinConfirmation",
                    roomType : "public",
                    payload : {
                        username : username,
                        timestamp : Date.now()
                    }
                }));
            };


        
            if(data.type === "chat"){
                const username = users.get(socket);

                if(!username){
                    socket.send(JSON.stringify({
                        type : "error",
                        message : "User not found"
                    }));
                    return;
                }

                const message  = {
                    content : data.payload.message,
                    sender : username
                }

                const publicRoom = rooms.get("publicId");
                
                if(publicRoom){
                    publicRoom.messages.push(message);
                    publicRoom.lastActive = Date.now(); 

                    publicRoom.users.forEach((_,userSocket) => {
                        if(userSocket !== socket){
                            userSocket.send(JSON.stringify({
                            type : "chat",
                            roomType : "public",
                            payload : {
                                message : message.content,
                                sender : message.sender,
                                timestamp : Date.now()
                            }
                        }));
                    }});
                };
            };
        
        };

        // all logic for the || private room || join code 
        if(data.roomType === "private"){
            if(data.type === "join"){
                if(data.gencode){
                    const roomCode = randomBytes(3).toString('hex').toUpperCase();
                    const username = data.payload.username;

                    users.set(socket, username);

                    rooms.set(roomCode , {
                        users : new Map([[socket,username]]),
                        messages : [],
                        lastActive : Date.now(),
                        roomType : "private"
                    });

                    socket.send(JSON.stringify({
                        type : "roomCreated",
                        roomType : "private",
                        payload : {
                            roomCode : roomCode,
                            username : username,
                            timestamp : Date.now()
                        }
                    }));

                }else{

                    const roomId = data.payload.roomId;
                    const username = data.payload.username;

                    const privateRoom = rooms.get(roomId);
                    if(privateRoom){
                        privateRoom.users.set(socket,username);
                        users.set(socket,username);

                        socket.send(JSON.stringify({
                            type : "joinConfirmation",
                            roomType : "private",
                            payload : {
                                roomId : roomId,
                                username : username,
                                timestamp : Date.now()
                            }
                        }));
                    }else{
                        socket.send(JSON.stringify({
                            type : "err",
                            message : "room not found"
                        }))
                    }

                }
            }
        
            if(data.type === "chat"){
                const username = users.get(socket);
                const roomId = data.payload.roomId;

                if(!username){
                    socket.send(JSON.stringify({
                        type : "err",
                        message : "User not found"
                    }));
                    return;
                }

                const message = {
                    content : data.payload.message,
                    sender : username
                }

                const privateRoom = rooms.get(roomId);
                if(privateRoom){
                    privateRoom.messages.push(message);
                    privateRoom.lastActive = Date.now(); // Update activity timestamp

                    privateRoom.users.forEach((_ , userSocket) => {
                        if(userSocket !== socket){
                            userSocket.send(JSON.stringify({
                                type : "chat",
                                roomType : "private",
                                payload : {
                                    roomId : roomId,
                                    message : message.content,
                                    sender : message.sender,
                                    timestamp : Date.now()
                                }
                            }));
                        }
                    })
                }
            }
        }

    }catch(error){
        console.log("JSON parse Error : ",error);
        socket.send(JSON.stringify({
            type : "error",
            message : "Invalid message format"
        }))
    }
}); 


    socket.on("close", () => {
        users.delete(socket);
    
        rooms.forEach((room, roomId) => {
            if (room.users.has(socket)) {
                    room.users.delete(socket);
    
                if (room.users.size === 0 && roomId !== "publicId") {
                    rooms.delete(roomId);
                }
            }
        });
    });             
});