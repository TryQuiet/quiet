const { Module } = require('@nestjs/common')
const { Tor } = require('./tor.service.cjs')

// No production Tor password factory, process launcher or control provider is
// instantiated in this build. Auth, QSS, databases and mobile bridge stay real.
class TorModule {}
Module({ providers: [Tor], exports: [Tor] })(TorModule)

module.exports = { TorModule }
