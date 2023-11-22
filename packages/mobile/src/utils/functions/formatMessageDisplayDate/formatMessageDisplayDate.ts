import { DateTime } from 'luxon'

export const formatMessageDisplayDate = (createdAt: number): string => {
    const messageDate = new Date(createdAt * 1000)
    const now = new Date()
    // Check if message was sent within the same year and month.
    if (messageDate.getFullYear() === now.getFullYear()) {
        // Check if message was sent yesterday
        if (messageDate.getDay() + 1 === now.getDay()) {
            return 'Yesterday'
        }
        // Check if message was sent today.
        if (messageDate.getMonth() === now.getMonth() && messageDate.getDay() === now.getDay()) {
            return DateTime.fromSeconds(createdAt).toLocaleString(DateTime.TIME_SIMPLE)
        }
    }
    return DateTime.fromSeconds(createdAt).toLocaleString()
}
