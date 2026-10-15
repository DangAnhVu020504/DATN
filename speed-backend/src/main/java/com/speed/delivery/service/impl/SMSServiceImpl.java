package com.speed.delivery.service.impl;

import com.speed.delivery.service.SMSService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * SMSService implementation (Mock).
 */
@Slf4j
@Service
public class SMSServiceImpl implements SMSService {

    @Override
    public void sendSms(String phoneNumber, String message) {
        log.info("[MOCK SMS] To: {}, Message: {}", phoneNumber, message);
    }
}
