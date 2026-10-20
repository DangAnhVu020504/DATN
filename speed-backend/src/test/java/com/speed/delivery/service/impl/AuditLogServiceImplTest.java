package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.LogResponse;
import com.speed.delivery.entity.Log;
import com.speed.delivery.repository.LogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho AuditLogServiceImpl - 13 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, willThrow, then/should,
 *       shouldHaveNoMoreInteractions</li>
 *   <li>ArgumentCaptor: Bắt đối tượng Log truyền vào save() ở happy path và edge case</li>
 *   <li>PageImpl thật: kiểm tra ánh xạ và metadata phân trang, không mock Page/Pageable</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependency cần mock: LogRepository.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogServiceImpl Unit Tests")
class AuditLogServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private LogRepository logRepository;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private AuditLogServiceImpl auditLogService;

    // ===== TEST DATA =====
    private static final LocalDateTime T1 = LocalDateTime.of(2026, 1, 15, 10, 30);
    private static final LocalDateTime T2 = LocalDateTime.of(2026, 1, 15, 11, 0);
    private static final String DB_ERROR_MESSAGE = "Database is down";

    private PageRequest pageable;
    private Log log1;
    private Log log2;
    private Log systemLog;

    @BeforeEach
    void setUp() {
        // Arrange chung: fixture cố định, không phụ thuộc thời gian hiện tại
        pageable = PageRequest.of(0, 10);

        log1 = Log.builder()
                .id(1L)
                .userId(5L)
                .action("CREATE_ORDER")
                .entityType("Order")
                .entityId(42L)
                .details("Order #42 created")
                .createdAt(T1)
                .build();

        log2 = Log.builder()
                .id(2L)
                .userId(5L)
                .action("LOGIN")
                .entityType("User")
                .entityId(5L)
                .details("User logged in")
                .createdAt(T2)
                .build();

        systemLog = Log.builder()
                .id(3L)
                .userId(null)
                .action("CLEANUP")
                .entityType(null)
                .entityId(null)
                .details(null)
                .createdAt(T2)
                .build();
    }

    // ==================== LOG (5 THAM SỐ) ====================
    @Nested
    @DisplayName("Ghi log đầy đủ (5 tham số)")
    class GhiLogDayDuTests {

        @Test
        @DisplayName("AL-TC01: Ghi log đầy đủ 5 tham số - tạo đúng Log và save một lần")
        void log5Params_Success() {
            // Arrange
            ArgumentCaptor<Log> logCaptor = ArgumentCaptor.forClass(Log.class);

            // Act
            auditLogService.log(1L, "CREATE_ORDER", "Order", 42L, "Order #42 created");

            // Verify: save được gọi đúng một lần
            then(logRepository).should(times(1)).save(logCaptor.capture());

            // Assert: Log được tạo với đúng 5 giá trị, các trường do JPA set vẫn null
            Log captured = logCaptor.getValue();
            assertThat(captured.getUserId()).isEqualTo(1L);
            assertThat(captured.getAction()).isEqualTo("CREATE_ORDER");
            assertThat(captured.getEntityType()).isEqualTo("Order");
            assertThat(captured.getEntityId()).isEqualTo(42L);
            assertThat(captured.getDetails()).isEqualTo("Order #42 created");
            assertThat(captured.getId()).isNull();
            assertThat(captured.getCreatedAt()).isNull();
            assertThat(captured.getIpAddress()).isNull();

            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC02: Ghi log hệ thống với userId = null - vẫn save thành công")
        void log5Params_NullUserId() {
            // Arrange
            ArgumentCaptor<Log> logCaptor = ArgumentCaptor.forClass(Log.class);

            // Act
            auditLogService.log(null, "TOGGLE_USER_ACTIVE", "User", 7L, "User 7 toggled");

            // Verify
            then(logRepository).should(times(1)).save(logCaptor.capture());

            // Assert: userId null được giữ nguyên, các trường còn lại đúng
            Log captured = logCaptor.getValue();
            assertThat(captured.getUserId()).isNull();
            assertThat(captured.getAction()).isEqualTo("TOGGLE_USER_ACTIVE");
            assertThat(captured.getEntityType()).isEqualTo("User");
            assertThat(captured.getEntityId()).isEqualTo(7L);
            assertThat(captured.getDetails()).isEqualTo("User 7 toggled");
            assertThat(captured.getId()).isNull();
            assertThat(captured.getCreatedAt()).isNull();
            assertThat(captured.getIpAddress()).isNull();

            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC03: Ghi log 5 tham số - repository lỗi DB thì ngoại lệ lan truyền")
        void log5Params_RepositoryThrows() {
            // Arrange: save ném lỗi DB
            given(logRepository.save(any(Log.class)))
                    .willThrow(new DataAccessResourceFailureException(DB_ERROR_MESSAGE));

            // Act & Assert: ngoại lệ giữ nguyên type và message
            assertThatThrownBy(() ->
                    auditLogService.log(1L, "CREATE_ORDER", "Order", 42L, "Order #42 created"))
                    .isInstanceOf(DataAccessResourceFailureException.class)
                    .hasMessage(DB_ERROR_MESSAGE);

            // Verify: SUT đã cố save đúng một lần trước khi lỗi lan truyền
            then(logRepository).should(times(1)).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }
    }

    // ==================== LOG (2 THAM SỐ) ====================
    @Nested
    @DisplayName("Ghi log tối giản (2 tham số)")
    class GhiLogToiGianTests {

        @Test
        @DisplayName("AL-TC04: Ghi log 2 tham số - chỉ set action và details")
        void log2Params_Success() {
            // Arrange
            ArgumentCaptor<Log> logCaptor = ArgumentCaptor.forClass(Log.class);

            // Act
            auditLogService.log("SYSTEM_STARTUP", "Application started");

            // Verify
            then(logRepository).should(times(1)).save(logCaptor.capture());

            // Assert: chỉ action/details có giá trị, mọi trường khác null
            Log captured = logCaptor.getValue();
            assertThat(captured.getAction()).isEqualTo("SYSTEM_STARTUP");
            assertThat(captured.getDetails()).isEqualTo("Application started");
            assertThat(captured.getUserId()).isNull();
            assertThat(captured.getEntityType()).isNull();
            assertThat(captured.getEntityId()).isNull();
            assertThat(captured.getId()).isNull();
            assertThat(captured.getCreatedAt()).isNull();
            assertThat(captured.getIpAddress()).isNull();

            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC05: Ghi log 2 tham số với details = null - vẫn save thành công")
        void log2Params_NullDetails() {
            // Arrange
            ArgumentCaptor<Log> logCaptor = ArgumentCaptor.forClass(Log.class);

            // Act
            auditLogService.log("CLEANUP", null);

            // Verify
            then(logRepository).should(times(1)).save(logCaptor.capture());

            // Assert
            Log captured = logCaptor.getValue();
            assertThat(captured.getAction()).isEqualTo("CLEANUP");
            assertThat(captured.getDetails()).isNull();
            assertThat(captured.getUserId()).isNull();
            assertThat(captured.getEntityType()).isNull();
            assertThat(captured.getEntityId()).isNull();
            assertThat(captured.getId()).isNull();
            assertThat(captured.getCreatedAt()).isNull();
            assertThat(captured.getIpAddress()).isNull();

            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC06: Ghi log 2 tham số - repository lỗi DB thì ngoại lệ lan truyền")
        void log2Params_RepositoryThrows() {
            // Arrange
            given(logRepository.save(any(Log.class)))
                    .willThrow(new DataAccessResourceFailureException(DB_ERROR_MESSAGE));

            // Act & Assert
            assertThatThrownBy(() -> auditLogService.log("SYSTEM_STARTUP", "Application started"))
                    .isInstanceOf(DataAccessResourceFailureException.class)
                    .hasMessage(DB_ERROR_MESSAGE);

            // Verify
            then(logRepository).should(times(1)).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }
    }

    // ==================== GET ALL LOGS ====================
    @Nested
    @DisplayName("Lấy toàn bộ log")
    class LayTatCaLogTests {

        @Test
        @DisplayName("AL-TC07: Lấy toàn bộ log - ánh xạ đủ 7 trường và giữ metadata")
        void getAllLogs_Success() {
            // Arrange: page có 2 log, thứ tự log1 rồi log2
            given(logRepository.findAllByOrderByCreatedAtDesc(pageable))
                    .willReturn(new PageImpl<>(List.of(log1, log2), pageable, 2));

            // Act
            Page<LogResponse> result = auditLogService.getAllLogs(pageable);

            // Assert: nội dung và thứ tự được giữ nguyên
            assertThat(result.getContent()).hasSize(2);
            LogResponse first = result.getContent().get(0);
            assertThat(first.getId()).isEqualTo(1L);
            assertThat(first.getUserId()).isEqualTo(5L);
            assertThat(first.getAction()).isEqualTo("CREATE_ORDER");
            assertThat(first.getEntityType()).isEqualTo("Order");
            assertThat(first.getEntityId()).isEqualTo(42L);
            assertThat(first.getDetails()).isEqualTo("Order #42 created");
            assertThat(first.getCreatedAt()).isEqualTo(T1);

            LogResponse second = result.getContent().get(1);
            assertThat(second.getId()).isEqualTo(2L);
            assertThat(second.getUserId()).isEqualTo(5L);
            assertThat(second.getAction()).isEqualTo("LOGIN");
            assertThat(second.getEntityType()).isEqualTo("User");
            assertThat(second.getEntityId()).isEqualTo(5L);
            assertThat(second.getDetails()).isEqualTo("User logged in");
            assertThat(second.getCreatedAt()).isEqualTo(T2);

            // Assert: metadata phân trang
            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getTotalPages()).isEqualTo(1);
            assertThat(result.getNumber()).isZero();
            assertThat(result.getSize()).isEqualTo(10);

            // Verify: đúng finder, không gọi finder theo user, không save
            then(logRepository).should(times(1)).findAllByOrderByCreatedAtDesc(pageable);
            then(logRepository).should(never()).findByUserIdOrderByCreatedAtDesc(any(), any());
            then(logRepository).should(never()).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC08: Lấy toàn bộ log - trang rỗng trả về page rỗng, không NPE")
        void getAllLogs_EmptyPage() {
            // Arrange
            given(logRepository.findAllByOrderByCreatedAtDesc(pageable))
                    .willReturn(new PageImpl<>(List.of(), pageable, 0));

            // Act
            Page<LogResponse> result = auditLogService.getAllLogs(pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
            assertThat(result.getTotalPages()).isZero();
            assertThat(result.getNumber()).isZero();
            assertThat(result.getSize()).isEqualTo(10);

            // Verify
            then(logRepository).should(times(1)).findAllByOrderByCreatedAtDesc(pageable);
            then(logRepository).should(never()).findByUserIdOrderByCreatedAtDesc(any(), any());
            then(logRepository).should(never()).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC09: Lấy toàn bộ log - repository lỗi DB thì ngoại lệ lan truyền")
        void getAllLogs_RepositoryThrows() {
            // Arrange
            given(logRepository.findAllByOrderByCreatedAtDesc(pageable))
                    .willThrow(new DataAccessResourceFailureException(DB_ERROR_MESSAGE));

            // Act & Assert
            assertThatThrownBy(() -> auditLogService.getAllLogs(pageable))
                    .isInstanceOf(DataAccessResourceFailureException.class)
                    .hasMessage(DB_ERROR_MESSAGE);

            // Verify: chỉ gọi đúng finder một lần, không gọi chéo, không save
            then(logRepository).should(times(1)).findAllByOrderByCreatedAtDesc(pageable);
            then(logRepository).should(never()).findByUserIdOrderByCreatedAtDesc(any(), any());
            then(logRepository).should(never()).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC13: Lấy toàn bộ log - log hệ thống có các trường tham chiếu null")
        void getAllLogs_SystemLogWithNullFields() {
            // Arrange
            given(logRepository.findAllByOrderByCreatedAtDesc(pageable))
                    .willReturn(new PageImpl<>(List.of(systemLog), pageable, 1));

            // Act
            Page<LogResponse> result = auditLogService.getAllLogs(pageable);

            // Assert: ánh xạ null an toàn, không NPE
            assertThat(result.getContent()).hasSize(1);
            LogResponse mapped = result.getContent().get(0);
            assertThat(mapped.getId()).isEqualTo(3L);
            assertThat(mapped.getAction()).isEqualTo("CLEANUP");
            assertThat(mapped.getCreatedAt()).isEqualTo(T2);
            assertThat(mapped.getUserId()).isNull();
            assertThat(mapped.getEntityType()).isNull();
            assertThat(mapped.getEntityId()).isNull();
            assertThat(mapped.getDetails()).isNull();
            assertThat(result.getTotalElements()).isEqualTo(1);

            // Verify
            then(logRepository).should(times(1)).findAllByOrderByCreatedAtDesc(pageable);
            then(logRepository).should(never()).findByUserIdOrderByCreatedAtDesc(any(), any());
            then(logRepository).should(never()).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }
    }

    // ==================== GET USER LOGS ====================
    @Nested
    @DisplayName("Lấy log theo người dùng")
    class LayLogTheoNguoiDungTests {

        @Test
        @DisplayName("AL-TC10: Lấy log theo user - ánh xạ đủ 7 trường và giữ metadata")
        void getUserLogs_Success() {
            // Arrange
            given(logRepository.findByUserIdOrderByCreatedAtDesc(5L, pageable))
                    .willReturn(new PageImpl<>(List.of(log1, log2), pageable, 2));

            // Act
            Page<LogResponse> result = auditLogService.getUserLogs(5L, pageable);

            // Assert: nội dung giữ thứ tự và ánh xạ đủ trường
            assertThat(result.getContent()).hasSize(2);
            LogResponse first = result.getContent().get(0);
            assertThat(first.getId()).isEqualTo(1L);
            assertThat(first.getUserId()).isEqualTo(5L);
            assertThat(first.getAction()).isEqualTo("CREATE_ORDER");
            assertThat(first.getEntityType()).isEqualTo("Order");
            assertThat(first.getEntityId()).isEqualTo(42L);
            assertThat(first.getDetails()).isEqualTo("Order #42 created");
            assertThat(first.getCreatedAt()).isEqualTo(T1);

            LogResponse second = result.getContent().get(1);
            assertThat(second.getId()).isEqualTo(2L);
            assertThat(second.getUserId()).isEqualTo(5L);
            assertThat(second.getAction()).isEqualTo("LOGIN");
            assertThat(second.getEntityType()).isEqualTo("User");
            assertThat(second.getEntityId()).isEqualTo(5L);
            assertThat(second.getDetails()).isEqualTo("User logged in");
            assertThat(second.getCreatedAt()).isEqualTo(T2);

            // Assert: metadata
            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getTotalPages()).isEqualTo(1);
            assertThat(result.getNumber()).isZero();
            assertThat(result.getSize()).isEqualTo(10);

            // Verify: đúng userId và pageable, không gọi finder toàn bộ, không save
            then(logRepository).should(times(1)).findByUserIdOrderByCreatedAtDesc(5L, pageable);
            then(logRepository).should(never()).findAllByOrderByCreatedAtDesc(any());
            then(logRepository).should(never()).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC11: Lấy log theo user - trang rỗng trả về page rỗng, không NPE")
        void getUserLogs_EmptyPage() {
            // Arrange
            given(logRepository.findByUserIdOrderByCreatedAtDesc(999L, pageable))
                    .willReturn(new PageImpl<>(List.of(), pageable, 0));

            // Act
            Page<LogResponse> result = auditLogService.getUserLogs(999L, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
            assertThat(result.getTotalPages()).isZero();
            assertThat(result.getNumber()).isZero();
            assertThat(result.getSize()).isEqualTo(10);

            // Verify
            then(logRepository).should(times(1)).findByUserIdOrderByCreatedAtDesc(999L, pageable);
            then(logRepository).should(never()).findAllByOrderByCreatedAtDesc(any());
            then(logRepository).should(never()).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }

        @Test
        @DisplayName("AL-TC12: Lấy log theo user - repository lỗi DB thì ngoại lệ lan truyền")
        void getUserLogs_RepositoryThrows() {
            // Arrange
            given(logRepository.findByUserIdOrderByCreatedAtDesc(5L, pageable))
                    .willThrow(new DataAccessResourceFailureException(DB_ERROR_MESSAGE));

            // Act & Assert
            assertThatThrownBy(() -> auditLogService.getUserLogs(5L, pageable))
                    .isInstanceOf(DataAccessResourceFailureException.class)
                    .hasMessage(DB_ERROR_MESSAGE);

            // Verify: chỉ gọi đúng finder một lần với đúng userId, không gọi chéo, không save
            then(logRepository).should(times(1)).findByUserIdOrderByCreatedAtDesc(5L, pageable);
            then(logRepository).should(never()).findAllByOrderByCreatedAtDesc(any());
            then(logRepository).should(never()).save(any(Log.class));
            then(logRepository).shouldHaveNoMoreInteractions();
        }
    }
}
