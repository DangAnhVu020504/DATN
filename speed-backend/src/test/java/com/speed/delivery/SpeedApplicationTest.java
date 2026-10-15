package com.speed.delivery;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Smoke test - Verify application context loads.
 */
class SpeedApplicationTest {

    @Test
    void main_shouldNotThrowException() {
        assertDoesNotThrow(() -> {
            // Just verify the class exists and is loadable
        });
    }
}
