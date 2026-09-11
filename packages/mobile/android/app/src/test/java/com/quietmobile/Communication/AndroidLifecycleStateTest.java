package com.quietmobile.Communication;

import org.junit.Test;

import static org.junit.Assert.*;

public class AndroidLifecycleStateTest {
    @Test
    public void readinessReconcilesCurrentStateWithoutReplayingOldTransitions() {
        AndroidLifecycleState state = new AndroidLifecycleState();
        assertNull(state.nextFrontendEvent(true));
        assertNull(state.nextFrontendEvent(false));
        state.setListenerReady(true);
        assertEquals("appresume", state.nextFrontendEvent(true));
        assertNull(state.nextFrontendEvent(true));
        assertEquals("appbackground", state.nextFrontendEvent(false));
        assertNull(state.nextFrontendEvent(false));
        assertEquals("appresume", state.nextFrontendEvent(true));
    }

    @Test
    public void jsRecreationReconcilesEvenWhenActivityStateHasNotChanged() {
        AndroidLifecycleState state = new AndroidLifecycleState();
        state.setListenerReady(true);
        assertEquals("appresume", state.nextFrontendEvent(true));
        state.setListenerReady(false);
        assertNull(state.nextFrontendEvent(true));
        state.setListenerReady(true);
        assertEquals("appresume", state.nextFrontendEvent(true));
        state.setListenerReady(false);
        state.setListenerReady(true);
        assertEquals("appbackground", state.nextFrontendEvent(false));
    }

    @Test
    public void connectionAnnouncementsRequireListenersAndCredentialsButNotTheBackendHandshake() {
        AndroidLifecycleState state = new AndroidLifecycleState();
        assertFalse(state.canAnnounceConnection(11000, "secret"));
        state.setListenerReady(true);
        assertFalse(state.canAnnounceConnection(0, "secret"));
        assertFalse(state.canAnnounceConnection(65536, "secret"));
        assertFalse(state.canAnnounceConnection(11000, ""));
        assertFalse(state.canAnnounceConnection(11000, null));
        // The frontend must send START before Node can announce backendReady.
        assertTrue(state.canAnnounceConnection(11000, "secret"));
        state.setListenerReady(false);
        assertFalse(state.canAnnounceConnection(11000, "secret"));
    }

    @Test
    public void backendReadinessDoesNotRestartAnElapsedGracePeriod() {
        AndroidLifecycleState state = new AndroidLifecycleState();
        assertEquals(30000, state.remainingHibernateDelay(1000, 30000));
        assertEquals(20000, state.remainingHibernateDelay(11000, 30000));
        // The first timer expired before Node could receive hibernate.
        assertEquals(0, state.remainingHibernateDelay(41000, 30000));
    }

    @Test
    public void foregroundOrBackgroundPermissionCancelsThePreviousDeadline() {
        AndroidLifecycleState state = new AndroidLifecycleState();
        assertEquals(30000, state.remainingHibernateDelay(1000, 30000));
        state.cancelHibernate();
        assertEquals(30000, state.remainingHibernateDelay(11000, 30000));
    }
}
