import protons from 'protons'

export const { Request } = protons(`
message Request {
  enum Type {
    SEND_MESSAGE = 0;
    MERGE_COMMIT_INFO = 1;
  }

  required Type type = 1;
  optional SendMessage sendMessage = 2;
  optional MergeCommitInfo mergeCommitInfo = 3;
}

message SendMessage {
  required bytes data = 1;
  required int64 created = 2;
  required bytes id = 3;
  required bytes parentId = 4;
  required bytes channelId = 5;
  required bytes currentHEAD = 6;
  required bytes from = 7;
}

message MergeCommitInfo {
  required int64 created = 1;
  required bytes id = 2;
  required bytes currentHEAD = 3;
  required bytes channelId = 4;
}
`)
