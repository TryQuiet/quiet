import { createSelector } from "reselect";
import identitySelectors from "./identity";

import { Store } from '../reducers'

const users = (s: Store) => s.users

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
