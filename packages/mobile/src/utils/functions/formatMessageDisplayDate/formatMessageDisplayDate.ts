import { DateTime } from 'luxon';

export const formatMessageDisplayDate = (createdAt: number): string => {
  const now = DateTime.now().toSeconds();
  const diff = now - createdAt;
  if (diff > 86400) {
    return DateTime.fromSeconds(createdAt).toFormat('LLL dd, t');
  } else {
    return DateTime.fromSeconds(createdAt).toFormat('t');
  }
};
