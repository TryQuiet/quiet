import protons from 'protons'

export const { Request } = protons(`
message Request {
  enum MessageType {
    SEND_MESSAGE = 0;
    MERGE_COMMIT_INFO = 1;
  }

  required MessageType messageType = 1;
  optional SendMessage sendMessage = 2;
  optional MergeCommitInfo mergeCommitInfo = 3;
}

message SendMessage {
  required string id = 1;
  required int32 type = 2;
  required string message = 3;
  required int64 createdAt = 4;
  required string parentId = 5;
  required string channelId = 6;
  required int32 r = 7;
  required string currentHEAD = 8;
  required string signature = 9;
  required int32 typeIndicator = 10;
}

message MergeCommitInfo {
  required int64 created = 1;
  required bytes id = 2;
  required bytes currentHEAD = 3;
  required bytes channelId = 4;
}
`)
