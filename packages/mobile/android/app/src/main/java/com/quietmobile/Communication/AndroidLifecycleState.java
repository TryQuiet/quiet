package com.quietmobile.Communication;

/** State shared by activity, backend and JS readiness callbacks, confined to the main thread. */
final class AndroidLifecycleState {
    private boolean listenerReady;
    private Boolean deliveredForeground;
    private Long hibernateDeadline;

    void setListenerReady(boolean ready) {
        listenerReady = ready;
        if (!ready) deliveredForeground = null;
    }

    String nextFrontendEvent(boolean foreground) {
        if (!listenerReady || Boolean.valueOf(foreground).equals(deliveredForeground)) return null;
        deliveredForeground = foreground;
        return foreground ? "appresume" : "appbackground";
    }

    boolean canAnnounceConnection(int port, String secret) {
        return listenerReady && port > 0 && port <= 65535
                && secret != null && !secret.isEmpty();
    }

    long remainingHibernateDelay(long now, long gracePeriod) {
        if (hibernateDeadline == null) hibernateDeadline = now + gracePeriod;
        return Math.max(0, hibernateDeadline - now);
    }

    void cancelHibernate() {
        hibernateDeadline = null;
    }
}
