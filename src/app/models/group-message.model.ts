import { GroupMessageDirection } from './enums/group-message-direction.enum';

export class GroupMessage {
    timestamp: number;
    groupId: string;
    did: string;
    nickname: string;
    text: string;
    direction: GroupMessageDirection;
    isSeen: boolean;

    constructor(timestamp: number = null, groupId: string = "", did: string = "", nickname: string = "", text: string = "", direction: GroupMessageDirection = null, isSeen: boolean = false) {
        this.timestamp = timestamp;
        this.groupId = groupId;
        this.did = did;
        this.nickname = nickname;
        this.text = text;
        this.direction = direction;
        this.isSeen = isSeen;
    }

    public toJsonObject(): any {
        let json: any = {
            timestamp: this.timestamp,
            groupId: this.groupId,
            did: this.did,
            nickname: this.nickname,
            text: this.text,
            direction: this.direction,
            isSeen: this.isSeen
        };
        return json;
    }

    public static fromJsonObject(json: any): GroupMessage {
        let message = new GroupMessage();
        message.timestamp = json.timestamp;
        message.groupId = json.groupId;
        message.did = json.did;
        message.nickname = json.nickname;
        message.text = json.text;
        message.direction = json.direction;
        message.isSeen = json.isSeen;
        return message;
    }
}