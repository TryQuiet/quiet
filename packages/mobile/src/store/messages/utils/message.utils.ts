import { DateTime } from 'luxon';

export const generateMessageId = () => {
  return Math.random().toString(36).substr(2.9);
};

export const getCurrentTime = () => {
  return DateTime.utc().toSeconds();
};
