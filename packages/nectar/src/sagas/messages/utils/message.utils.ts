import { DateTime } from 'luxon';

export const generateMessageId = () => Math.random().toString(36).substr(2.9);

export const getCurrentTime = () => DateTime.utc().toSeconds();
