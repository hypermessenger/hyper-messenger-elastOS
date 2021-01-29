import { FriendDirection } from './enums/friend-direction.enum';
import { FriendState } from './enums/friend-state.enum';
import { ConnectionState } from './enums/connection-state.enum';
import { PresenceState } from './enums/presence-state.enum';

export class Friend {

    avatarColors = ['#fe812c', '#6c4af2', '#e31a50', '#3980eb', '#2ca4be'];

    did: string;
    address: string;
    userId: string;
    nickname: string;
    message: string;
    direction: FriendDirection;
    state: FriendState;
    connectionState: ConnectionState;
    presenceState: PresenceState;
    avatarColor: string;

    constructor(
        did: string = "", 
        address: string = "",
        userId: string = "",
        nickname: string = "",
        message: string = "",
        direction: FriendDirection = null,
        state: FriendState = null,
        connectionState: ConnectionState = null,
        presenceState: PresenceState = null,
    ) {
        this.did = did;
        this.address = address;
        this.userId = userId;
        this.nickname = nickname;
        this.message = message;
        this.direction = direction;
        this.state = state;
        this.connectionState = connectionState;
        this.presenceState = presenceState;
        this.avatarColor = this.getColor();
    }

    public static fromJsonObject(json: any): Friend {
        let friend = new Friend();
        friend.did = json.did;
        friend.address = json.address;
        friend.userId = json.userId;
        friend.nickname = json.nickname;
        friend.message = json.message;
        friend.direction = json.direction;
        friend.state = json.state;
        friend.connectionState = json.connectionState;
        friend.presenceState = json.presenceState;
        friend.avatarColor = json.avatarColor;
        return friend;
    }

    public toHiveObject(): HivePlugin.JSONObject {
        let json: HivePlugin.JSONObject = {
            did: this.did,
            address: this.address,
            userId: this.userId,
            nickname: this.nickname,
            message: this.message,
            direction: this.direction,
            state: this.state,
            connectionState: this.connectionState,
            presenceState: this.presenceState,
            avatarColor: this.avatarColor,
        };
        return json;
    }

    public static fromHiveObject(json: HivePlugin.JSONObject): Friend {
        let friend = new Friend();
        friend.did = json.did as string;
        friend.address = json.address as string;
        friend.userId = json.userId as string;
        friend.nickname = json.nickname as string;
        friend.message = json.message as string;
        friend.direction = json.direction as number;
        friend.state = json.state as number;
        friend.connectionState = json.connectionState as number;
        friend.presenceState = json.presenceState as number;
        friend.avatarColor = json.avatarColor as string;
        return friend;
    }

    getColor() {
        return this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
    }
}