import { Friend } from '../models/friend.model';
import { Group } from '../models/group.model';
import { Message } from '../models/message.model';

export class HiveUtil {
    public static GROUP_COLLECTION = "hyper_groups";
    public static FRIEND_COLLECTION = "hyper_friends";
    public static SELF_DATA_COLLECTION = "hyper_self_data";

    public static getJsonData(address: string, userId: string): HivePlugin.JSONObject {
        let json: HivePlugin.JSONObject = {
            address: address,
            userId: userId
        };
        return json;
    }

    public static getJsonFriendList(friendList: Friend[]): HivePlugin.JSONObject[] {
        let jsonFriendList: HivePlugin.JSONObject[] = [];
        for (let friend of friendList) {
            jsonFriendList.push(friend.toHiveObject());
        }
        return jsonFriendList;
    }

    public static getFriendList(jsonFriendList: HivePlugin.JSONObject[]): Friend[] {
        let friendList: Friend[] = [];
        for (let jsonFriend of jsonFriendList) {
            friendList.push(Friend.fromHiveObject(jsonFriend));
        }
        return friendList;
    }

    public static getMessageList(jsonMessageList: HivePlugin.JSONObject[]): Message[] {
        let messageList: Message[] = [];
        for (let jsonMessage of jsonMessageList) {
            messageList.push(Message.fromJsonObject(jsonMessage.messageItem));
        }
        return messageList;
    }

    public static getGroupList(jsonGroupList: HivePlugin.JSONObject[]): Group[] {
        let groupList: Group[] = [];
        for (let jsonGroup of jsonGroupList) {
            groupList.push(Group.fromHiveObject(jsonGroup));
        }
        return groupList;
    }
}