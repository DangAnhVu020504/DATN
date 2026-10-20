package com.speed.delivery.service.impl;

import com.speed.delivery.entity.Voucher;
import com.speed.delivery.enums.DiscountType;
import com.speed.delivery.exception.BadRequestException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.exception.VoucherExpiredException;
import com.speed.delivery.repository.VoucherRepository;
import com.speed.delivery.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * VoucherService implementation - Quản lý mã giảm giá.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;

    @Override
    @Transactional(readOnly = true)
    public Voucher validateVoucher(String code, BigDecimal orderValue) {
        log.info("Validating voucher: {}", code);

        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "code", code));

        if (!voucher.getIsActive()) {
            throw new BadRequestException("Voucher đã bị vô hiệu hóa");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartDate()) || now.isAfter(voucher.getEndDate())) {
            throw new VoucherExpiredException("Voucher đã hết hạn hoặc chưa có hiệu lực");
        }

        if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new BadRequestException("Voucher đã hết lượt sử dụng");
        }

        if (orderValue.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new BadRequestException(
                    "Giá trị đơn hàng tối thiểu để sử dụng voucher là: " + voucher.getMinOrderValue());
        }

        return voucher;
    }

    @Override
    @Transactional
    public BigDecimal applyVoucher(Voucher voucher, BigDecimal orderValue) {
        BigDecimal discount;

        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = orderValue.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.CEILING);
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        // Cập nhật lượt sử dụng
        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);

        log.info("Voucher {} applied, discount: {}", voucher.getCode(), discount);
        return discount;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Voucher> getActiveVouchers() {
        return voucherRepository.findActiveVouchers(LocalDateTime.now());
    }

    @Override
    @Transactional
    public Voucher createVoucher(Voucher voucher) {
        if (voucherRepository.findByCode(voucher.getCode()).isPresent()) {
            throw new BadRequestException("Mã voucher đã tồn tại: " + voucher.getCode());
        }
        return voucherRepository.save(voucher);
    }

    @Override
    @Transactional(readOnly = true)
    public Voucher getVoucherById(Long id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    @Override
    @Transactional
    public Voucher toggleActive(Long id) {
        Voucher voucher = getVoucherById(id);
        voucher.setIsActive(!voucher.getIsActive());
        Voucher saved = voucherRepository.save(voucher);
        log.info("Voucher {} active set to {}", voucher.getCode(), saved.getIsActive());
        return saved;
    }
}
