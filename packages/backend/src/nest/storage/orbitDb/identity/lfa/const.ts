export const LFA_IDENTITY_PROVIDER_TYPE = 'lfa-identity-provider'

/**
 * Domain-separation context for OrbitDB entry signatures. OrbitDB entries are a different protocol
 * purpose from LFA team messages and graph links, so they get their own context: a signature made
 * here cannot be replayed as either, and vice versa.
 */
export const LFA_ORBITDB_ENTRY_SIGNATURE_CONTEXT = 'quiet/orbitdb/entry-signature'
