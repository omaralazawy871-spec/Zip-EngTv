package com.engtv.data.api

import org.junit.Assert.*
import org.junit.Test

class AuthTokenHolderTest {

    @Test
    fun `clear resets token and unauthorized flag`() {
        AuthTokenHolder.token = "test-token"
        assertNotNull(AuthTokenHolder.token)
        AuthTokenHolder.clear()
        assertNull(AuthTokenHolder.token)
    }

    @Test
    fun `notifyUnauthorized clears token and invokes callback`() {
        var called = false
        AuthTokenHolder.token = "test-token"
        AuthTokenHolder.onUnauthorized = { called = true }
        AuthTokenHolder.notifyUnauthorized()
        assertNull(AuthTokenHolder.token)
        assertTrue(called)
    }

    @Test
    fun `notifyUnauthorized only fires once`() {
        var callCount = 0
        AuthTokenHolder.token = "test-token"
        AuthTokenHolder.onUnauthorized = { callCount++ }
        AuthTokenHolder.notifyUnauthorized()
        AuthTokenHolder.notifyUnauthorized()
        assertEquals(1, callCount)
    }

    @Test
    fun `isExpired returns true when no token`() {
        AuthTokenHolder.token = null
        assertTrue(AuthTokenHolder.isExpired())
    }

    @Test
    fun `isExpired returns false for valid token`() {
        val futureExp = (System.currentTimeMillis() / 1000) + 3600
        val payload = """{"exp":$futureExp,"admin":true}"""
        val encoded = java.util.Base64.getUrlEncoder().encodeToString(payload.toByteArray())
        AuthTokenHolder.token = "header.$encoded.signature"
        assertFalse(AuthTokenHolder.isExpired())
    }

    @Test
    fun `isExpired returns true for expired token`() {
        val pastExp = (System.currentTimeMillis() / 1000) - 3600
        val payload = """{"exp":$pastExp,"admin":true}"""
        val encoded = java.util.Base64.getUrlEncoder().encodeToString(payload.toByteArray())
        AuthTokenHolder.token = "header.$encoded.signature"
        assertTrue(AuthTokenHolder.isExpired())
    }
}
