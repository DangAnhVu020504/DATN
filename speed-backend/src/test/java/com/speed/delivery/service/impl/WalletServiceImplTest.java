package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.TransactionResponse;
import com.speed.delivery.dto.response.WalletResponse;
import com.speed.delivery.entity.Driver;
import com.speed.delivery.entity.Order;
import com.speed.delivery.entity.Transaction;
import com.speed.delivery.entity.User;
import com.speed.delivery.entity.Wallet;
import com.speed.delivery.enums.DriverStatus;
import com.speed.delivery.enums.TransactionType;
import com.speed.delivery.exception.BadRequestException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.DriverRepository;
import com.speed.delivery.repository.TransactionRepository;
import com.speed.delivery.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho WalletServiceImpl - 16 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should, shouldHaveNoInteractions</li>
 *   <li>ArgumentCaptor: Bắt Wallet truyền vào save() và Transaction truyền vào save()
 *       để kiểm tra từng field (type, amount, balanceAfter, order, description)</li>
 *   <li>Kiểm thử nhánh tạo ví tự động (orElseGet) khi driver chưa có ví</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependencies cần mock (3): WalletRepository, TransactionRepository, DriverRepository.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WalletServiceImpl Unit Tests")
class WalletServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private WalletRepository walletRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private DriverRepository driverRepository;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private WalletServiceImpl walletService;

    // ===== TEST DATA =====
    private User driverUser;
    private Driver testDriver;
    private Wallet testWallet;

    @BeforeEach
    void setUp() {
        // Arrange chung: Tài xế có ví với số dư 500,000
        driverUser = User.builder()
                .id(5L).email("driver@speed.vn").fullName("Tran Van Tai Xe")
                .phone("0902222222").isActive(true).build();

        testDriver = Driver.builder()
                .id(1L).user(driverUser).isAvailable(true).status(DriverStatus.ONLINE)
                .totalDeliveries(10).totalEarnings(BigDecimal.valueOf(800000))
                .rating(BigDecimal.valueOf(4.5)).build();

        testWallet = Wallet.builder()
                .id(1L).driver(testDriver).balance(BigDecimal.valueOf(500000))
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
    }

    // ==================== GET WALLET ====================
    @Nested
    @DisplayName("Get Wallet")
    class GetWalletTests {

        @Test
        @DisplayName("WL-TC01: Lấy ví thành công - ví đã tồn tại")
        void getWallet_Success() {
            // Arrange: Driver và Wallet đều tồn tại
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.of(testWallet));

            // Act: Lấy ví
            WalletResponse result = walletService.getWallet(1L);

            // Assert: Thông tin ví map đúng
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getDriverId()).isEqualTo(1L);
            assertThat(result.getDriverName()).isEqualTo("Tran Van Tai Xe");
            assertThat(result.getBalance()).isEqualByComparingTo("500000");

            // Verify: Ví đã tồn tại → KHÔNG tạo ví mới
            then(walletRepository).should(never()).save(any(Wallet.class));
        }

        @Test
        @DisplayName("WL-TC02: Ví chưa tồn tại → tự động tạo ví mới số dư 0")
        void getWallet_AutoCreateWhenMissing() {
            // Arrange: Driver tồn tại nhưng chưa có ví (orElseGet branch)
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.empty());
            given(walletRepository.save(any(Wallet.class))).willReturn(
                    Wallet.builder().id(9L).driver(testDriver).balance(BigDecimal.ZERO).build());

            // Act
            WalletResponse result = walletService.getWallet(1L);

            // Assert: Ví mới tạo với số dư 0
            assertThat(result.getId()).isEqualTo(9L);
            assertThat(result.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);

            // Verify: Capture Wallet truyền vào save() để kiểm tra nội dung
            ArgumentCaptor<Wallet> walletCaptor = ArgumentCaptor.forClass(Wallet.class);
            then(walletRepository).should(times(1)).save(walletCaptor.capture());
            Wallet captured = walletCaptor.getValue();
            assertThat(captured.getDriver()).isSameAs(testDriver);
            assertThat(captured.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("WL-TC03: Lấy ví - driver không tồn tại → ResourceNotFoundException")
        void getWallet_DriverNotFound() {
            // Arrange: DriverRepository trả về empty
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Phải fail-fast với đúng ngoại lệ
            assertThatThrownBy(() -> walletService.getWallet(999L))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không chạm tới WalletRepository (fail-fast)
            then(walletRepository).shouldHaveNoInteractions();
        }
    }

    // ==================== ADD EARNING ====================
    @Nested
    @DisplayName("Add Earning")
    class AddEarningTests {

        @Test
        @DisplayName("WL-TC04: Cộng thu nhập thành công - ArgumentCaptor kiểm tra Transaction")
        void addEarning_Success() {
            // Arrange: Ví tồn tại với số dư 500,000
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.of(testWallet));
            given(walletRepository.save(any(Wallet.class))).willReturn(testWallet);
            ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);

            // Act: Cộng 32,000 thu nhập cho đơn #42
            WalletResponse result = walletService.addEarning(1L, 42L, BigDecimal.valueOf(32000));

            // Assert: Số dư mới = 500,000 + 32,000
            assertThat(result.getBalance()).isEqualByComparingTo("532000");

            // Verify: Giao dịch EARNING được lưu với đầy đủ thông tin
            then(transactionRepository).should(times(1)).save(txCaptor.capture());
            Transaction tx = txCaptor.getValue();
            assertThat(tx.getType()).isEqualTo(TransactionType.EARNING);
            assertThat(tx.getAmount()).isEqualByComparingTo("32000");
            assertThat(tx.getBalanceAfter()).isEqualByComparingTo("532000");
            assertThat(tx.getOrder().getId()).isEqualTo(42L);
            assertThat(tx.getWallet()).isSameAs(testWallet);
            assertThat(tx.getDescription()).contains("#42");
            then(walletRepository).should(times(1)).save(any(Wallet.class));
        }

        @Test
        @DisplayName("WL-TC05: Số tiền null → BadRequestException, không chạm repository")
        void addEarning_NullAmount() {
            // Act & Assert
            assertThatThrownBy(() -> walletService.addEarning(1L, 42L, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("lớn hơn 0");

            // Verify: Không tìm driver, không lưu gì
            then(driverRepository).shouldHaveNoInteractions();
            then(walletRepository).shouldHaveNoInteractions();
            then(transactionRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("WL-TC06: Số tiền bằng 0 → BadRequestException")
        void addEarning_ZeroAmount() {
            assertThatThrownBy(() -> walletService.addEarning(1L, 42L, BigDecimal.ZERO))
                    .isInstanceOf(BadRequestException.class);

            then(walletRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("WL-TC07: Số tiền âm → BadRequestException")
        void addEarning_NegativeAmount() {
            assertThatThrownBy(() -> walletService.addEarning(1L, 42L, BigDecimal.valueOf(-1000)))
                    .isInstanceOf(BadRequestException.class);

            then(walletRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("WL-TC08: Cộng thu nhập - driver không tồn tại → ResourceNotFoundException")
        void addEarning_DriverNotFound() {
            // Arrange: Số tiền hợp lệ nhưng không tìm thấy driver
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> walletService.addEarning(999L, 42L, BigDecimal.valueOf(32000)))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không tạo ví, không lưu giao dịch
            then(walletRepository).should(never()).save(any(Wallet.class));
            then(transactionRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("WL-TC09: Cộng thu nhập - ví chưa tồn tại → tự tạo ví rồi cộng")
        void addEarning_CreatesWalletWhenMissing() {
            // Arrange: Driver tồn tại nhưng chưa có ví
            Wallet created = Wallet.builder().id(9L).driver(testDriver).balance(BigDecimal.ZERO).build();
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.empty());
            given(walletRepository.save(any(Wallet.class))).willReturn(created);

            // Act
            WalletResponse result = walletService.addEarning(1L, 42L, BigDecimal.valueOf(32000));

            // Assert: Ví mới được tạo rồi cộng tiền
            assertThat(result.getBalance()).isEqualByComparingTo("32000");

            // Verify: save() gọi 2 lần (1 tạo ví + 1 cập nhật số dư) + transaction được lưu
            then(walletRepository).should(times(2)).save(any(Wallet.class));
            then(transactionRepository).should(times(1)).save(any(Transaction.class));
        }
    }

    // ==================== GET TRANSACTIONS ====================
    @Nested
    @DisplayName("Get Transactions")
    class GetTransactionsTests {

        @Test
        @DisplayName("WL-TC10: Lấy lịch sử giao dịch - map đủ field, order null → orderId null")
        void getTransactions_Success() {
            // Arrange: 1 giao dịch thu nhập (có order) + 1 giao dịch rút tiền (không order)
            Transaction earningTx = Transaction.builder()
                    .id(1L).wallet(testWallet)
                    .order(Order.builder().id(42L).build())
                    .type(TransactionType.EARNING).amount(BigDecimal.valueOf(32000))
                    .balanceAfter(BigDecimal.valueOf(532000)).description("Thu nhập đơn hàng #42")
                    .createdAt(LocalDateTime.now()).build();
            Transaction withdrawTx = Transaction.builder()
                    .id(2L).wallet(testWallet).order(null)
                    .type(TransactionType.WITHDRAWAL).amount(BigDecimal.valueOf(100000))
                    .balanceAfter(BigDecimal.valueOf(432000)).description("Rút tiền")
                    .createdAt(LocalDateTime.now()).build();

            PageRequest pageable = PageRequest.of(0, 10);
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.of(testWallet));
            given(transactionRepository.findByWalletIdOrderByCreatedAtDesc(1L, pageable))
                    .willReturn(new PageImpl<>(List.of(earningTx, withdrawTx), pageable, 2));

            // Act
            Page<TransactionResponse> result = walletService.getTransactions(1L, pageable);

            // Assert: Page map đúng
            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getContent().get(0).getType()).isEqualTo("EARNING");
            assertThat(result.getContent().get(0).getOrderId()).isEqualTo(42L);
            assertThat(result.getContent().get(0).getDescription()).isEqualTo("Thu nhập đơn hàng #42");
            assertThat(result.getContent().get(1).getType()).isEqualTo("WITHDRAWAL");
            assertThat(result.getContent().get(1).getOrderId()).isNull();

            // Verify: tìm theo walletId của ví
            then(transactionRepository).should(times(1))
                    .findByWalletIdOrderByCreatedAtDesc(1L, pageable);
        }

        @Test
        @DisplayName("WL-TC11: Lấy giao dịch - chưa có ví → ResourceNotFoundException")
        void getTransactions_WalletNotFound() {
            // Arrange: Driver chưa có ví
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> walletService.getTransactions(1L, PageRequest.of(0, 10)))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không truy vấn transaction
            then(transactionRepository).shouldHaveNoInteractions();
        }
    }

    // ==================== WITHDRAW ====================
    @Nested
    @DisplayName("Withdraw")
    class WithdrawTests {

        @Test
        @DisplayName("WL-TC12: Rút tiền thành công - ArgumentCaptor kiểm tra Transaction")
        void withdraw_Success() {
            // Arrange: Ví có 500,000, rút 100,000
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.of(testWallet));
            given(walletRepository.save(any(Wallet.class))).willReturn(testWallet);
            ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);

            // Act
            WalletResponse result = walletService.withdraw(1L, BigDecimal.valueOf(100000));

            // Assert: Số dư còn 400,000
            assertThat(result.getBalance()).isEqualByComparingTo("400000");

            // Verify: Giao dịch WITHDRAWAL được lưu đúng
            then(transactionRepository).should(times(1)).save(txCaptor.capture());
            Transaction tx = txCaptor.getValue();
            assertThat(tx.getType()).isEqualTo(TransactionType.WITHDRAWAL);
            assertThat(tx.getAmount()).isEqualByComparingTo("100000");
            assertThat(tx.getBalanceAfter()).isEqualByComparingTo("400000");
            assertThat(tx.getOrder()).isNull();
        }

        @Test
        @DisplayName("WL-TC13: Rút tiền null → BadRequestException")
        void withdraw_NullAmount() {
            assertThatThrownBy(() -> walletService.withdraw(1L, null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("lớn hơn 0");

            then(walletRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("WL-TC14: Rút tiền ≤ 0 → BadRequestException")
        void withdraw_NonPositiveAmount() {
            assertThatThrownBy(() -> walletService.withdraw(1L, BigDecimal.valueOf(-50000)))
                    .isInstanceOf(BadRequestException.class);

            then(walletRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("WL-TC15: Rút tiền - chưa có ví → ResourceNotFoundException")
        void withdraw_WalletNotFound() {
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> walletService.withdraw(1L, BigDecimal.valueOf(100000)))
                    .isInstanceOf(ResourceNotFoundException.class);

            then(transactionRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("WL-TC16: Số dư không đủ → BadRequestException, không lưu gì")
        void withdraw_InsufficientBalance() {
            // Arrange: Ví có 500,000 nhưng rút 600,000
            given(walletRepository.findByDriverId(1L)).willReturn(Optional.of(testWallet));

            // Act & Assert
            assertThatThrownBy(() -> walletService.withdraw(1L, BigDecimal.valueOf(600000)))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Số dư không đủ");

            // Verify: Số dư giữ nguyên, không save, không tạo giao dịch
            assertThat(testWallet.getBalance()).isEqualByComparingTo("500000");
            then(walletRepository).should(never()).save(any(Wallet.class));
            then(transactionRepository).shouldHaveNoInteractions();
        }
    }
}
