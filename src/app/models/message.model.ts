import { MessageDirection } from './enums/message-direction.enum';
import { MessageType } from './enums/message-type.enum';

export class Message {
    timestamp: number;
    did: string;
    text: string;
    direction: MessageDirection;
    type: MessageType;
    fileId: string;
    isSeen: boolean;

    constructor(
        timestamp: number = null,
        did: string = "",
        text: string = "",
        direction: MessageDirection = null,
        type: MessageType = null,
        fileId: string = "",
        isSeen: boolean = false
    ) {
        this.timestamp = timestamp;
        this.did = did;
        this.text = text;
        this.direction = direction;
        this.type = type;
        this.fileId = fileId;
        this.isSeen = isSeen;
    }

    public toJsonObject(): any {
        let json: any = {
            timestamp: this.timestamp,
            did: this.did,
            text: this.text,
            direction: this.direction,
            type: this.type,
            fileId: this.fileId,
            isSeen: this.isSeen
        };
        return json;
    }

    public static fromJsonObject(json: any): Message {
        let message = new Message();
        message.timestamp = json.timestamp;
        message.did = json.did;
        message.text = json.text;
        message.direction = json.direction;
        message.type = json.type;
        message.fileId = json.fileId;
        message.isSeen = json.isSeen;
        return message;
    }

    /*public toHiveObject(): HivePlugin.JSONObject {
        let json: HivePlugin.JSONObject = {
            timestamp: this.timestamp,
            userId: this.userId,
            text: this.text
        };
        return json;
    }

    public static fromHiveObject(json: HivePlugin.JSONObject): Message {
        let message = new Message();
        message.timestamp = json.groupId as number;
        message.userId = json.title as string;
        message.text = json.created as string;
        return message;
    }*/
}