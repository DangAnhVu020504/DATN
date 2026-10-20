package com.speed.delivery.service.impl;

import com.speed.delivery.entity.Voucher;
import com.speed.delivery.enums.DiscountType;
import com.speed.delivery.exception.BadRequestException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.exception.VoucherExpiredException;
import com.speed.delivery.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho VoucherServiceImpl - 18 test cases.
 * Minh họa mock VoucherRepository.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("VoucherServiceImpl Unit Tests")
class VoucherServiceImplTest {

    @Mock private VoucherRepository voucherRepository;
    @InjectMocks private VoucherServiceImpl voucherService;

    private Voucher percentVoucher;
    private Voucher fixedVoucher;

    @BeforeEach
    void setUp() {
        percentVoucher = Voucher.builder()
                .id(1L).code("SALE20").discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20)).maxDiscount(BigDecimal.valueOf(10000))
                .minOrderValue(BigDecimal.valueOf(30000)).usageLimit(100).usedCount(5)
                .isActive(true).startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30)).build();

        fixedVoucher = Voucher.builder()
                .id(2L).code("GIAM15K").discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(15000)).maxDiscount(null)
                .minOrderValue(BigDecimal.valueOf(50000)).usageLimit(50).usedCount(10)
                .isActive(true).startDate(LocalDateTime.now().minusDays(5))
                .endDate(LocalDateTime.now().plusDays(25)).build();
    }

    // ===== VALIDATE VOUCHER =====
    @Nested @DisplayName("Validate Voucher") class ValidateTests {
        @Test @DisplayName("Validate thành công")
        void validate_Success() {
            given(voucherRepository.findByCode("SALE20")).willReturn(Optional.of(percentVoucher));
            Voucher result = voucherService.validateVoucher("SALE20", BigDecimal.valueOf(50000));
            assertThat(result.getCode()).isEqualTo("SALE20");
        }

        @Test @DisplayName("Voucher không tồn tại")
        void validate_NotFound() {
            given(voucherRepository.findByCode("INVALID")).willReturn(Optional.empty());
            assertThatThrownBy(() -> voucherService.validateVoucher("INVALID", BigDecimal.valueOf(50000)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("Voucher bị vô hiệu hóa")
        void validate_Inactive() {
            percentVoucher.setIsActive(false);
            given(voucherRepository.findByCode("SALE20")).willReturn(Optional.of(percentVoucher));
            assertThatThrownBy(() -> voucherService.validateVoucher("SALE20", BigDecimal.valueOf(50000)))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("vô hiệu hóa");
        }

        @Test @DisplayName("Voucher hết hạn")
        void validate_Expired() {
            percentVoucher.setEndDate(LocalDateTime.now().minusDays(1));
            given(voucherRepository.findByCode("SALE20")).willReturn(Optional.of(percentVoucher));
            assertThatThrownBy(() -> voucherService.validateVoucher("SALE20", BigDecimal.valueOf(50000)))
                    .isInstanceOf(VoucherExpiredException.class);
        }

        @Test @DisplayName("Voucher chưa có hiệu lực")
        void validate_NotYetActive() {
            percentVoucher.setStartDate(LocalDateTime.now().plusDays(5));
            given(voucherRepository.findByCode("SALE20")).willReturn(Optional.of(percentVoucher));
            assertThatThrownBy(() -> voucherService.validateVoucher("SALE20", BigDecimal.valueOf(50000)))
                    .isInstanceOf(VoucherExpiredException.class);
        }

        @Test @DisplayName("Voucher hết lượt sử dụng")
        void validate_UsageLimitReached() {
            percentVoucher.setUsedCount(100);
            given(voucherRepository.findByCode("SALE20")).willReturn(Optional.of(percentVoucher));
            assertThatThrownBy(() -> voucherService.validateVoucher("SALE20", BigDecimal.valueOf(50000)))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("hết lượt");
        }

        @Test @DisplayName("Giá trị đơn hàng thấp hơn tối thiểu")
        void validate_BelowMinOrder() {
            given(voucherRepository.findByCode("SALE20")).willReturn(Optional.of(percentVoucher));
            assertThatThrownBy(() -> voucherService.validateVoucher("SALE20", BigDecimal.valueOf(10000)))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("tối thiểu");
        }
    }

    // ===== APPLY VOUCHER =====
    @Nested @DisplayName("Apply Voucher") class ApplyTests {
        @Test @DisplayName("Áp dụng voucher % - bình thường")
        void apply_Percentage() {
            BigDecimal discount = voucherService.applyVoucher(percentVoucher, BigDecimal.valueOf(40000));
            // 40000 * 20% = 8000
            assertThat(discount).isEqualTo(new BigDecimal("8000"));
            assertThat(percentVoucher.getUsedCount()).isEqualTo(6);
            then(voucherRepository).should().save(percentVoucher);
        }

        @Test @DisplayName("Áp dụng voucher % - cap tại maxDiscount")
        void apply_Percentage_MaxDiscount() {
            BigDecimal discount = voucherService.applyVoucher(percentVoucher, BigDecimal.valueOf(100000));
            // 100000 * 20% = 20000 → capped at 10000
            assertThat(discount).isEqualTo(new BigDecimal("10000"));
        }

        @Test @DisplayName("Áp dụng voucher số tiền cố định")
        void apply_Fixed() {
            BigDecimal discount = voucherService.applyVoucher(fixedVoucher, BigDecimal.valueOf(60000));
            assertThat(discount).isEqualTo(new BigDecimal("15000"));
            assertThat(fixedVoucher.getUsedCount()).isEqualTo(11);
        }
    }

    // ===== GET ACTIVE VOUCHERS =====
    @Test @DisplayName("Lấy danh sách voucher đang hoạt động")
    void getActiveVouchers() {
        given(voucherRepository.findActiveVouchers(any())).willReturn(List.of(percentVoucher, fixedVoucher));
        List<Voucher> result = voucherService.getActiveVouchers();
        assertThat(result).hasSize(2);
    }

    // ===== CREATE VOUCHER =====
    @Test @DisplayName("Tạo voucher thành công")
    void createVoucher_Success() {
        given(voucherRepository.findByCode("NEW50")).willReturn(Optional.empty());
        Voucher newV = Voucher.builder().code("NEW50").build();
        given(voucherRepository.save(newV)).willReturn(newV);
        Voucher result = voucherService.createVoucher(newV);
        assertThat(result.getCode()).isEqualTo("NEW50");
    }

    @Test @DisplayName("Tạo voucher - mã đã tồn tại")
    void createVoucher_Duplicate() {
        given(voucherRepository.findByCode("SALE20")).willReturn(Optional.of(percentVoucher));
        assertThatThrownBy(() -> voucherService.createVoucher(Voucher.builder().code("SALE20").build()))
                .isInstanceOf(BadRequestException.class);
    }

    // ===== GET BY ID / GET ALL / TOGGLE =====
    @Nested @DisplayName("Voucher Management") class ManagementTests {

        @Test @DisplayName("Lấy voucher theo ID thành công")
        void getVoucherById_Success() {
            given(voucherRepository.findById(1L)).willReturn(Optional.of(percentVoucher));

            Voucher result = voucherService.getVoucherById(1L);

            assertThat(result.getCode()).isEqualTo("SALE20");
            then(voucherRepository).should(times(1)).findById(1L);
        }

        @Test @DisplayName("Lấy voucher theo ID - không tồn tại → ResourceNotFoundException")
        void getVoucherById_NotFound() {
            given(voucherRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> voucherService.getVoucherById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("Lấy toàn bộ voucher")
        void getAllVouchers_Success() {
            given(voucherRepository.findAll()).willReturn(List.of(percentVoucher, fixedVoucher));

            List<Voucher> result = voucherService.getAllVouchers();

            assertThat(result).hasSize(2);
            then(voucherRepository).should(times(1)).findAll();
        }

        @Test @DisplayName("Toggle - đang hoạt động → vô hiệu hóa")
        void toggleActive_Deactivate() {
            given(voucherRepository.findById(1L)).willReturn(Optional.of(percentVoucher));
            given(voucherRepository.save(percentVoucher)).willReturn(percentVoucher);

            Voucher result = voucherService.toggleActive(1L);

            assertThat(result.getIsActive()).isFalse();
            then(voucherRepository).should(times(1)).save(percentVoucher);
        }

        @Test @DisplayName("Toggle - đang vô hiệu → kích hoạt lại")
        void toggleActive_Activate() {
            percentVoucher.setIsActive(false);
            given(voucherRepository.findById(1L)).willReturn(Optional.of(percentVoucher));
            given(voucherRepository.save(percentVoucher)).willReturn(percentVoucher);

            Voucher result = voucherService.toggleActive(1L);

            assertThat(result.getIsActive()).isTrue();
            then(voucherRepository).should(times(1)).save(percentVoucher);
        }
    }
}
