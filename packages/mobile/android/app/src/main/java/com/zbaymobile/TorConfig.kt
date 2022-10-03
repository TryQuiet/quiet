package com.zbaymobile

data class TorConfig (
    val controlPort: Int,
    val socksPort: Int,
    val httpTunnelPort: Int,
    val authCookie: String?
)
