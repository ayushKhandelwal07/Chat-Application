import { WebSocket, WebSocketServer } from "ws";


const wss = new WebSocketServer({port : 8080});


interface User {
        socket : WebSocket;
        roomId : string;
        type ?: "public" | "private"; 
}


const all_websockets : User[] = []; 


wss.on("connection", (socket) => {


        socket.on("message" ,(message : string)  => {
                
                try {
                        const data = JSON.parse(message);
                        
                        if(data.type === "join"){
                                all_websockets.push({
                                socket , 
                                roomId :  data.payload.roomId
                        });
                }

                if(data.type === "chat"){
                        const currentUserRoomId = all_websockets.find((x) => x.socket === socket)?.roomId;

                        if(!currentUserRoomId) {
                                socket.send(JSON.stringify({error: "User not in any room"}));
                                return;
                        }
                        
                        const currRoomUsers = all_websockets.filter((x) => {
                                return x.roomId === currentUserRoomId;
                        });
                        
                        currRoomUsers.forEach((x) => {
                                if(x.socket.readyState === WebSocket.OPEN && x.socket != socket) {
                                        x.socket.send(JSON.stringify({
                                                type: "chat",
                                                message: data.payload.message
                                        }));
                                }
                        });
                }

                } catch (error) {
                        console.error("Error parsing message:", error);
                        socket.send(JSON.stringify({error: "Invalid message format"}));
                        return;
                }
        });     


        socket.on("close", () => {
                all_websockets.filter(x => x.socket != socket);
        })
});