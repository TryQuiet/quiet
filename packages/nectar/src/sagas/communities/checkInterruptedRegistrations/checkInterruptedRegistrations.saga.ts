import { select } from "typed-redux-saga";
import { identitySelectors } from "../../identity/identity.selectors";

export function* checkInterruptedRegistrationsSaga(): Generator {
    const interruptedRegistration = yield* select(identitySelectors.interruptedRegistration)
    if (interruptedRegistration) {
        // Reuse or generate CSR
        if (interruptedRegistration.CA) {
            // Regster owner cert
        } else {
            // Call registrar
        }
    }
}
