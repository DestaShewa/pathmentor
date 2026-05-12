# Chat System Developer Guide

## 🏗️ Architecture Overview

### Backend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  - MessageInput (file selection, voice recording)           │
│  - MessageList (display attachments)                         │
│  - ChatRoom (orchestration)                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─── HTTP/REST API (multipart/form-data)
                 │    POST /api/messages (with files)
                 │
                 └─── WebSocket (Socket.io)
                      Real-time message broadcasting
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Backend Server                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js + Socket.io                              │  │
│  │  - Routes: messageRoutes.js                          │  │
│  │  - Controller: messageController.js                  │  │
│  │  - Middleware: uploadMiddleware.js (Multer)          │  │
│  │  - Model: Message.js (Mongoose)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │  File Storage: uploads/chat/                         │  │
│  │  - Images: chat-{timestamp}-{random}.jpg             │  │
│  │  - Documents: chat-{timestamp}-{random}.pdf          │  │
│  │  - Audio: chat-{timestamp}-{random}.webm             │  │
│  │  - Video: chat-{timestamp}-{random}.mp4              │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │  MongoDB Database                                    │  │
│  │  Collection: messages                                │  │
│  │  - Text content                                      │  │
│  │  - Attachments array (type, url, filename, size)    │  │
│  │  - Metadata (sender, roomId, timestamps)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

### Backend Files
```
backend/
├── models/
│   └── Message.js                 # Message schema with attachments
├── controllers/
│   └── messageController.js       # CRUD operations + file handling
├── routes/
│   └── messageRoutes.js           # API endpoints
├── middleware/
│   ├── authMiddleware.js          # Authentication
│   └── uploadMiddleware.js        # Multer file upload config
├── uploads/
│   └── chat/                      # File storage directory
└── server.js                      # Socket.io setup
```

### Frontend Files
```
frontend/src/
├── components/
│   └── chat/
│       ├── ChatRoom.tsx           # Main chat container
│       ├── MessageInput.tsx       # Input with file/voice support
│       └── MessageList.tsx        # Message display with attachments
├── pages/
│   ├── admin/
│   │   └── AdminChatPage.tsx     # Admin chat interface
│   ├── mentor/
│   │   └── MentorChat.tsx        # Mentor chat interface
│   └── StudyBuddies.tsx          # Student chat interface
└── services/
    ├── api.ts                     # Axios instance
    └── socket.ts                  # Socket.io client
```

## 🔧 Key Components

### 1. Message Model (Backend)
```javascript
// backend/models/Message.js
const messageSchema = new mongoose.Schema({
  sender: { type: ObjectId, ref: "User" },
  roomId: String,
  message: String,
  messageType: { 
    type: String, 
    enum: ["text", "document", "audio", "image", "video"],
    default: "text"
  },
  attachments: [{
    type: { type: String, enum: ["document", "image", "audio", "video"] },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  replyTo: { type: ObjectId, ref: "Message" },
  isEdited: { type: Boolean, default: false },
  deletedAt: Date,
  readBy: [{ user: ObjectId, readAt: Date }]
}, { timestamps: true });
```

### 2. Upload Middleware (Backend)
```javascript
// backend/middleware/uploadMiddleware.js
const chatUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/chat/"),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `chat-${uniqueSuffix}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "application/msword", "text/plain",
      "audio/mpeg", "audio/wav", "audio/webm",
      "video/mp4", "video/webm"
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  },
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});
```

### 3. Message Controller (Backend)
```javascript
// backend/controllers/messageController.js
exports.createMessage = async (req, res) => {
  const { roomId, message, messageType, replyTo } = req.body;
  const sender = req.user._id;
  
  // Process attachments
  const attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      attachments.push({
        type: getAttachmentType(file.mimetype),
        url: `/uploads/chat/${file.filename}`,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      });
    }
  }
  
  const newMsg = new Message({
    roomId,
    message: message || "",
    messageType: messageType || (attachments.length > 0 ? attachments[0].type : "text"),
    attachments,
    sender,
    replyTo
  });
  
  await newMsg.save();
  await newMsg.populate("sender", "name email role");
  
  // Broadcast via Socket.io
  const io = req.app.get("io");
  if (io) io.to(roomId).emit("newMessage", newMsg);
  
  res.status(201).json({ message: newMsg });
};
```

### 4. Message Routes (Backend)
```javascript
// backend/routes/messageRoutes.js
const { chatUpload } = require("../middleware/uploadMiddleware");

router.post("/", 
  guard,                                    // Authentication
  chatUpload.array("attachments", 5),       // File upload (max 5)
  createMessage                             // Controller
);
```

### 5. ChatRoom Component (Frontend)
```typescript
// frontend/src/components/chat/ChatRoom.tsx
const handleSendMessage = async (message: string, attachments?: File[]) => {
  const formData = new FormData();
  formData.append("roomId", roomId);
  if (message.trim()) formData.append("message", message.trim());
  
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });
  }
  
  const res = await api.post("/messages", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  
  // Broadcast via Socket.io
  socket.emit("sendMessage", { roomId, message: res.data.message });
};
```

### 6. MessageInput Component (Frontend)
```typescript
// frontend/src/components/chat/MessageInput.tsx
const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // File selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5));
  };
  
  // Voice recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    // ... recording logic
  };
  
  const handleSend = () => {
    onSend(message, attachments);
    setMessage("");
    setAttachments([]);
  };
  
  return (
    <div>
      <input type="file" multiple onChange={handleFileSelect} />
      <button onClick={startRecording}>🎤</button>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};
```

### 7. MessageList Component (Frontend)
```typescript
// frontend/src/components/chat/MessageList.tsx
const AttachmentPreview = ({ attachment }) => {
  if (attachment.type === "image") {
    return <img src={attachment.url} alt={attachment.filename} />;
  }
  
  if (attachment.type === "audio") {
    return <audio src={attachment.url} controls />;
  }
  
  if (attachment.type === "video") {
    return <video src={attachment.url} controls />;
  }
  
  return (
    <a href={attachment.url} download={attachment.filename}>
      📄 {attachment.filename}
    </a>
  );
};
```

## 🔐 Security Considerations

### File Upload Security
```javascript
// 1. File Type Whitelist (not blacklist)
const allowedTypes = [
  "image/jpeg", "image/png",
  "application/pdf",
  "audio/mpeg", "audio/wav",
  "video/mp4"
];

// 2. File Size Limit
limits: { fileSize: 25 * 1024 * 1024 } // 25MB

// 3. Unique Filenames (prevent overwrites)
filename: `chat-${Date.now()}-${Math.random()}.${ext}`

// 4. MIME Type Verification
const actualType = file.mimetype;
const expectedType = getTypeFromExtension(file.originalname);
if (actualType !== expectedType) throw new Error("MIME type mismatch");

// 5. Authentication Required
router.post("/", guard, chatUpload.array(...), createMessage);

// 6. File Storage Outside Web Root
destination: path.join(__dirname, "../uploads/chat/")

// 7. Serve Files with Proper Headers
app.use("/uploads", express.static("uploads", {
  setHeaders: (res, path) => {
    if (path.endsWith(".pdf")) {
      res.set("Content-Type", "application/pdf");
      res.set("Content-Disposition", "inline");
    }
  }
}));
```

### XSS Prevention
```typescript
// React automatically escapes text content
<p>{message.message}</p> // Safe

// For file URLs, validate they're from your server
const isValidUrl = (url: string) => {
  return url.startsWith("/uploads/") || url.startsWith(window.location.origin);
};
```

### CSRF Protection
```javascript
// Use CORS with credentials
app.use(cors({
  origin: "http://localhost:8080",
  credentials: true
}));

// Include auth token in requests
api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

## 🚀 Performance Optimization

### 1. Lazy Loading Images
```typescript
<img src={url} loading="lazy" />
```

### 2. Video Preload Metadata
```typescript
<video src={url} preload="metadata" />
```

### 3. File Upload Progress
```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await api.post("/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percent = (progressEvent.loaded / progressEvent.total) * 100;
      setUploadProgress(percent);
    }
  });
};
```

### 4. Message Pagination
```javascript
// Backend
exports.getMessagesByRoom = async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const messages = await Message.find({ roomId, deletedAt: null })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "name email role");
  
  res.json({ messages: messages.reverse(), page, hasMore: messages.length === limit });
};
```

### 5. Socket.io Connection Pooling
```javascript
// Reuse socket connection
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5001", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
  }
  return socket;
};
```

## 🐛 Debugging Tips

### 1. Check File Upload
```javascript
// Backend: Log file details
console.log("Files received:", req.files);
req.files.forEach(f => {
  console.log(`- ${f.originalname} (${f.mimetype}, ${f.size} bytes)`);
});
```

### 2. Check Socket.io Connection
```javascript
// Frontend
socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
socket.on("disconnect", () => console.log("❌ Socket disconnected"));
socket.on("error", (err) => console.error("Socket error:", err));
```

### 3. Check Message Creation
```javascript
// Backend
console.log("Creating message:", {
  roomId,
  message,
  attachments: attachments.length,
  sender: req.user._id
});
```

### 4. Check File Storage
```bash
# Verify files are being saved
ls -lh backend/uploads/chat/

# Check file permissions
chmod 755 backend/uploads/chat/
```

### 5. Check CORS
```javascript
// Backend: Log CORS requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.headers.origin}`);
  next();
});
```

## 📚 API Reference

### POST /api/messages
Create a new message with optional attachments.

**Request:**
```http
POST /api/messages
Content-Type: multipart/form-data
Authorization: Bearer {token}

roomId: "admin-123-456"
message: "Check out these files"
attachments: [File, File, ...]
```

**Response:**
```json
{
  "message": {
    "_id": "msg123",
    "roomId": "admin-123-456",
    "message": "Check out these files",
    "messageType": "image",
    "attachments": [
      {
        "type": "image",
        "url": "/uploads/chat/chat-1234567890-123.jpg",
        "filename": "photo.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg"
      }
    ],
    "sender": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/messages/room/:roomId
Get all messages for a room.

**Request:**
```http
GET /api/messages/room/admin-123-456
Authorization: Bearer {token}
```

**Response:**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "roomId": "admin-123-456",
      "message": "Hello!",
      "messageType": "text",
      "attachments": [],
      "sender": { ... },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Socket.io Events

**Client → Server:**
```javascript
// Join room
socket.emit("join", roomId);

// Send message (for broadcasting only, use REST API for creation)
socket.emit("sendMessage", { roomId, message: messageObject });

// Leave room
socket.emit("leave", roomId);
```

**Server → Client:**
```javascript
// New message received
socket.on("newMessage", (message) => {
  console.log("New message:", message);
});

// Message edited
socket.on("messageEdited", (message) => {
  console.log("Message edited:", message);
});

// Message deleted
socket.on("messageDeleted", ({ messageId }) => {
  console.log("Message deleted:", messageId);
});

// Conversation deleted
socket.on("conversationDeleted", ({ roomId }) => {
  console.log("Conversation deleted:", roomId);
});
```

## 🎓 Best Practices

### 1. Always Use FormData for File Uploads
```typescript
// ✅ Correct
const formData = new FormData();
formData.append("roomId", roomId);
formData.append("message", message);
files.forEach(f => formData.append("attachments", f));

// ❌ Wrong
const data = { roomId, message, files }; // Won't work for files
```

### 2. Handle Errors Gracefully
```typescript
try {
  await api.post("/messages", formData);
} catch (error) {
  if (error.response?.status === 413) {
    alert("File too large. Maximum size is 25MB.");
  } else if (error.response?.status === 400) {
    alert("Invalid file type.");
  } else {
    alert("Failed to send message. Please try again.");
  }
}
```

### 3. Clean Up Resources
```typescript
// Stop media streams
useEffect(() => {
  return () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };
}, []);
```

### 4. Validate on Both Client and Server
```typescript
// Client validation
if (file.size > 25 * 1024 * 1024) {
  alert("File too large");
  return;
}

// Server validation (always required)
if (req.file.size > 25 * 1024 * 1024) {
  throw new Error("File too large");
}
```

### 5. Use Optimistic UI Updates
```typescript
// Add message to UI immediately
setMessages(prev => [...prev, optimisticMessage]);

// Then send to server
try {
  const res = await api.post("/messages", data);
  // Update with real message from server
  setMessages(prev => prev.map(m => 
    m._id === optimisticMessage._id ? res.data.message : m
  ));
} catch (error) {
  // Remove optimistic message on error
  setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
}
```

## 🎉 Conclusion

This chat system provides:
- ✅ Secure file uploads with validation
- ✅ Real-time message delivery
- ✅ Voice recording support
- ✅ Multiple file types (images, documents, audio, video)
- ✅ Cross-role communication (Admin, Mentor, Student)
- ✅ Scalable architecture
- ✅ Production-ready code

For questions or issues, refer to the test guide or check the backend logs.
