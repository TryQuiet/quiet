import { select } from "typed-redux-saga";
import { identitySelectors } from "../../identity/identity.selectors";

export function* checkInterruptedRegistrationsSaga(): Generator {
    const interruptedRegistration = yield* select(identitySelectors.interruptedRegistration)
    if (interruptedRegistration) {
        if (interruptedRegistration.CA) {
            // Register owner certificate
        } else {
            // Call registrar
        }
    }
}
