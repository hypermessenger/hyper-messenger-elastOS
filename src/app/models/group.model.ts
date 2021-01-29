import { GroupState } from './enums/group-state.enum';
import { GroupDirection } from './enums/group-direction.enum';

export class Group {
    avatarColors = ['#fe812c', '#6c4af2', '#e31a50', '#3980eb', '#2ca4be'];

    groupId: string;
    hostUserId: string;
    hostDid: string;
    title: string;
    state: GroupState;
    direction: GroupDirection;
    groupCreated: number;
    groupModified: number;
    cookie: string;
    fromDid: string;
    avatarColor: string;

    constructor(
        groupId: string = "",
        hostUserId: string = "",
        hostDid: string = "", 
        title: string = "",
        state: GroupState = null,
        direction: GroupDirection = null,
        groupCreated: number = null,
        groupModified: number = null,
        cookie: string = "",
        fromDid: string = ""
    ) {
        this.groupId = groupId;
        this.hostUserId = hostUserId;
        this.hostDid = hostDid;
		this.title = title;
		this.state = state;
        this.direction = direction;
        this.groupCreated = groupCreated;
        this.groupModified = groupModified;
        this.cookie = cookie;
        this.fromDid = fromDid;
        this.avatarColor = this.getColor();
    }

    public static fromJsonObject(json: any): Group {
        let group = new Group();
        group.groupId = json.groupId;
        group.hostUserId = json.hostUserId;
        group.hostDid = json.hostDid;
        group.title = json.title;
        group.state = json.state;
        group.direction = json.direction;
        group.groupCreated = json.groupCreated;
        group.groupModified = json.groupModified;
        group.cookie = json.cookie;
        group.fromDid = json.fromDid;
        group.avatarColor = json.avatarColor;
        return group;
    }

    public toHiveObject(): HivePlugin.JSONObject {
        let json: HivePlugin.JSONObject = {
            groupId: this.groupId,
            hostUserId: this.hostUserId,
            hostDid: this.hostDid,
            title: this.title,
            state: this.state,
            direction: this.direction,
            groupCreated: this.groupCreated,
            groupModified: this.groupModified,
            cookie: this.cookie,
            fromDid: this.fromDid,
            avatarColor: this.avatarColor
        };
        return json;
    }

    public static fromHiveObject(json: HivePlugin.JSONObject): Group {
        let group = new Group();
        group.groupId = json.groupId as string;
        group.hostUserId = json.hostUserId as string;
        group.hostDid = json.hostDid as string;
        group.title = json.title as string;
        group.state = json.state as number;
        group.direction = json.direction as number;
        group.groupCreated = json.groupCreated as number;
        group.groupModified = json.groupModified as number;
        group.cookie = json.cookie as string;
        group.fromDid = json.fromDid as string;
        group.avatarColor = json.avatarColor as string;
        return group;
    }

    getColor() {
        return this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
    }
}