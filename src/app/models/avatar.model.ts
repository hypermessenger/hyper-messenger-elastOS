// Uploaded image avatar
export class Avatar {
    contentType: string; // Ex: "image/jpeg"
    data: string;        // Ex: "/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQ..."
    type?: string;       // Ex: "base64"
}

// Temporary avatar with random background color and user's initials
export class TempAvatar {
    color: string;
    initial: string;
}
