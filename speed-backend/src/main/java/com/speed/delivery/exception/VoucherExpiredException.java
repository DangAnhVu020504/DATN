package com.speed.delivery.exception;

public class VoucherExpiredException extends RuntimeException {
    public VoucherExpiredException(String message) {
        super(message);
    }
}
