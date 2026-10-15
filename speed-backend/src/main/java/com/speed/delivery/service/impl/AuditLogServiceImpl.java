package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.LogResponse;
import com.speed.delivery.entity.Log;
import com.speed.delivery.repository.LogRepository;
import com.speed.delivery.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AuditLogService implementation - Ghi log hành động vào database.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final LogRepository logRepository;

    @Override
    public void log(Long userId, String action, String entityType, Long entityId, String details) {
        Log auditLog = Log.builder()
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        logRepository.save(auditLog);
        log.debug("Audit log: userId={}, action={}, entity={}#{}", userId, action, entityType, entityId);
    }

    @Override
    public void log(String action, String details) {
        Log auditLog = Log.builder()
                .action(action)
                .details(details)
                .build();
        logRepository.save(auditLog);
        log.debug("Audit log: action={}, details={}", action, details);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LogResponse> getAllLogs(Pageable pageable) {
        return logRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LogResponse> getUserLogs(Long userId, Pageable pageable) {
        return logRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapResponse);
    }

    private LogResponse mapResponse(Log log) {
        return LogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
