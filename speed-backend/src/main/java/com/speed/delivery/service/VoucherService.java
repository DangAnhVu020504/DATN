package com.speed.delivery.service;

import com.speed.delivery.entity.Voucher;
import java.math.BigDecimal;
import java.util.List;

/** Voucher Service. */
public interface VoucherService {
    Voucher validateVoucher(String code, BigDecimal orderValue);
    BigDecimal applyVoucher(Voucher voucher, BigDecimal orderValue);
    List<Voucher> getActiveVouchers();
    Voucher createVoucher(Voucher voucher);
    Voucher getVoucherById(Long id);
    List<Voucher> getAllVouchers();
    Voucher toggleActive(Long id);
}
