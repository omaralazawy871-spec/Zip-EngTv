package com.engtv.data.cast

abstract class CastManager {
    open fun isCastAvailable(): Boolean = false
    open fun castStream(url: String) {}
    open fun endCast() {}
}

class NoOpCastManager : CastManager()
