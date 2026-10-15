package com.speed.delivery.service;

import com.speed.delivery.dto.response.LogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Audit Log Service. */
public interface AuditLogService {
    void log(Long userId, String action, String entityType, Long entityId, String details);
    void log(String action, String details);
    Page<LogResponse> getAllLogs(Pageable pageable);
    Page<LogResponse> getUserLogs(Long userId, Pageable pageable);
}
