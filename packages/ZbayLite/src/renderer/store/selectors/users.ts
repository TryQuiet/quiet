import { createSelector } from "reselect";
import identitySelectors from "./identity";

import { UsersStore } from "../handlers/users";

const users = (s): UsersStore => s.users as UsersStore;

const isRegisteredUsername = (nickname) =>
  createSelector(users, (users) => {
    return Array.from(Object.values(users))
      .map((user) => user.nickname)
      .includes(nickname);
  });
  
const registeredUser = (signerPubKey) =>
  createSelector(users, (users) => {
    return users[signerPubKey]
  });

const myUser = createSelector(
  users,
  identitySelectors.signerPubKey,
  (users, signerPubKey) => {
    return (
      users[signerPubKey] || {
        firstName: "",
        lastName: "",
        nickname: "anon" + signerPubKey.substring(0, 16),
        address: "",
        createdAt: 0,
      }
    );
  }
);

export default {
  users,
  myUser,
  registeredUser,
  isRegisteredUsername,
};
