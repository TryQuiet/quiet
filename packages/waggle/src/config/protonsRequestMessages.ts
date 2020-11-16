import protons from 'protons'

export const { Request } = protons(`
message Request {
  enum Type {
    SEND_MESSAGE = 0;
  }

  required Type type = 1;
  optional SendMessage sendMessage = 2;
}

message SendMessage {
  required bytes data = 1;
  required int64 created = 2;
  required bytes id = 3;
}
`)
