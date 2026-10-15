# Demo cho chức năng đăng nhập

## 3.1. Đối tượng thực nghiệm
Đối tượng thực nghiệm của đề tài là chức năng Đăng nhập (Login) thuộc Hệ thống Quản lý Thư viện. Lớp nghiệp vụ chính cần kiểm thử là `AuthService`, có nhiệm vụ xác thực thông tin tài khoản của người dùng. Để hoàn thành nghiệp vụ đăng nhập, `AuthService` phụ thuộc trực tiếp vào lớp truy xuất dữ liệu `UserRepository` (kết nối CSDL) và dịch vụ mã hóa mật khẩu `PasswordEncoder`. 

Mã nguồn của các thành phần (Source Code):

**Interface UserRepository (Thành phần phụ thuộc CSDL):**
```java
public interface UserRepository {
    // Tìm kiếm người dùng theo username trong CSDL
    Optional<User> findByUsername(String username);
}
```

**Interface PasswordEncoder (Thành phần phụ thuộc Dịch vụ Mã hóa):**
```java
public interface PasswordEncoder {
    // So sánh mật khẩu thô và mật khẩu đã mã hóa trong CSDL
    boolean matches(String rawPassword, String encodedPassword);
}
```

**Lớp AuthService (Đối tượng kiểm thử chính - Class Under Test):**
```java
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    // Tiêm phụ thuộc (Dependency Injection) qua Constructor
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    public User login(String username, String password) {
        // 1. Kiểm tra tham số đầu vào
        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên đăng nhập và mật khẩu không được để trống");
        }
        // 2. Tìm người dùng trong CSDL
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));
        // 3. Kiểm tra trạng thái tài khoản
        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }
        // 4. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác");
        }
        return user;
    }
}
```

## 3.2. Môi trường thực nghiệm
Môi trường phần mềm và thư viện được sử dụng để xây dựng và thực thi các kịch bản kiểm thử đơn vị: 
* **Ngôn ngữ lập trình:** Java (JDK 17). 
* **Framework kiểm thử (Testing Framework):** JUnit 5 (JUnit Jupiter). 
* **Framework Mocking:** Mockito 5.x. 
* **Công cụ quản lý thư viện & Build:** Maven.
* **Môi trường phát triển (IDE):** IntelliJ IDEA / Eclipse.

## 3.3. Thiết kế các kịch bản Unit Test
Dựa trên logic nghiệp vụ của hàm `login()`, các kịch bản kiểm thử (Test Cases) được thiết kế bao phủ cả luồng thành công (Happy Path) và các luồng ngoại lệ/lỗi (Edge Cases/Exceptions): 

| Mã TC | Tên kịch bản (Test Case) | Đầu vào (Input) | Trạng thái Mock Data | Kết quả mong đợi (Expected) |
|---|---|---|---|---|
| TC01 | Đăng nhập thành công với thông tin hợp lệ | username="admin", password="123456" | findByUsername trả về User hợp lệ, active=true; matches trả về true | Trả về đối tượng User tương ứng. |
| TC02 | Đăng nhập thất bại do tên đăng nhập trống | username="", password="123456" | Không gọi tới Mock Repository | Bắn ra IllegalArgumentException. |
| TC03 | Đăng nhập thất bại do tài khoản không tồn tại | username="notfound", password="123456" | findByUsername trả về Optional.empty() | Bắn ra RuntimeException ("Tài khoản không tồn tại"). |
| TC04 | Đăng nhập thất bại do tài khoản bị khóa | username="locked_user", password="123456" | findByUsername trả về User có isActive = false | Bắn ra RuntimeException ("Tài khoản đã bị khóa"). |
| TC05 | Đăng nhập thất bại do sai mật khẩu | username="admin", password="wrongpass" | findByUsername trả về User hợp lệ; matches trả về false | Bắn ra RuntimeException ("Mật khẩu không chính xác"). |

## 3.4. Xây dựng và thực thi Unit Test với Mockito
Dưới đây là mã nguồn kiểm thử đơn vị `AuthServiceTest` áp dụng kỹ thuật Mocking sử dụng Mockito và JUnit 5: 

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {
    @Mock
    private UserRepository userRepository; // Giả lập UserRepository
    
    @Mock
    private PasswordEncoder passwordEncoder; // Giả lập PasswordEncoder
    
    @InjectMocks
    private AuthService authService; // Tiêm các Mock object vào AuthService
    
    private User sampleUser;
    
    @BeforeEach
    void setUp() {
        // Khởi tạo dữ liệu mẫu trước mỗi bài test
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUsername("admin");
        sampleUser.setPassword("encoded_password_123456");
        sampleUser.setActive(true);
    }
    
    @Test
    @DisplayName("TC01: Đăng nhập thành công khi thông tin hợp lệ")
    void login_Success_WhenCredentialsAreValid() {
        // Arrange (Thiết lập hành vi Mock)
        given(userRepository.findByUsername("admin")).willReturn(Optional.of(sampleUser));
        given(passwordEncoder.matches("123456", "encoded_password_123456")).willReturn(true);
        
        // Act (Thực thi hàm cần test)
        User result = authService.login("admin", "123456");
        
        // Assert (Kiểm tra kết quả và xác minh hành vi)
        assertNotNull(result);
        assertEquals("admin", result.getUsername());
        
        // Verify (Xác minh phụ thuộc đã được gọi đúng số lần)
        then(userRepository).should(times(1)).findByUsername("admin");
        then(passwordEncoder).should(times(1)).matches("123456", "encoded_password_123456");
    }
    
    @Test
    @DisplayName("TC02: Ném ngoại lệ khi tên đăng nhập bị rỗng")
    void login_ShouldThrowException_WhenUsernameIsEmpty() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.login("", "123456");
        });
        assertEquals("Tên đăng nhập và mật khẩu không được để trống", exception.getMessage());
        
        // Verify: Đảm bảo không gọi vào CSDL hay PasswordEncoder khi validate thất bại
        then(userRepository).shouldHaveNoInteractions();
        then(passwordEncoder).shouldHaveNoInteractions();
    }
    
    @Test
    @DisplayName("TC03: Ném ngoại lệ khi không tìm thấy tài khoản trong CSDL")
    void login_ShouldThrowException_WhenUserNotFound() {
        // Arrange: CSDL không tìm thấy user
        given(userRepository.findByUsername("notfound")).willReturn(Optional.empty());
        
        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login("notfound", "123456");
        });
        assertEquals("Tài khoản không tồn tại", exception.getMessage());
        then(passwordEncoder).shouldHaveNoInteractions(); // Chưa tìm thấy user thì không kiểm tra pass
    }
    
    @Test
    @DisplayName("TC04: Ném ngoại lệ khi tài khoản bị khóa")
    void login_ShouldThrowException_WhenUserIsLocked() {
        // Arrange
        sampleUser.setActive(false); // Đặt tài khoản về trạng thái khóa
        given(userRepository.findByUsername("admin")).willReturn(Optional.of(sampleUser));
        
        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login("admin", "123456");
        });
        assertEquals("Tài khoản đã bị khóa", exception.getMessage());
        then(passwordEncoder).shouldHaveNoInteractions();
    }
    
    @Test
    @DisplayName("TC05: Ném ngoại lệ khi mật khẩu không trùng khớp")
    void login_ShouldThrowException_WhenPasswordIsIncorrect() {
        // Arrange
        given(userRepository.findByUsername("admin")).willReturn(Optional.of(sampleUser));
        given(passwordEncoder.matches("wrongpass", "encoded_password_123456")).willReturn(false);
        
        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login("admin", "wrongpass");
        });
        assertEquals("Mật khẩu không chính xác", exception.getMessage());
    }
}
```

## 3.5. Đánh giá kết quả thực nghiệm
Sau khi xây dựng và thực thi bộ kiểm thử đơn vị cho chức năng Đăng nhập, kết quả thu được phản ánh rõ rệt ưu điểm của việc áp dụng kỹ thuật Mocking: 
* **Khả năng cô lập phụ thuộc hoàn hảo:** Bộ Unit Test kiểm thử logic nghiệp vụ của `AuthService` độc lập hoàn toàn với CSDL thật và thư viện mã hóa. Thậm chí khi chưa triển khai kết nối CSDL PostgreSQL/MySQL, bộ kiểm thử vẫn chạy thành công 100%. 
* **Tốc độ thực thi vượt trội:**
  * Thời gian thực thi toàn bộ 5 Test Cases chỉ mất khoảng ~150 - 200 ms.
  * So với việc phải khởi chạy H2 Database hoặc Spring Context (mất từ 3 - 5 giây), việc sử dụng `@Mock` giúp giảm thời gian kiểm thử hơn 95%.
* **Chủ động mô phỏng các trường hợp biên (Edge Cases):** Thông qua việc sử dụng Mockito (`given(...).willReturn(...)`), việc giả lập các trường hợp dữ liệu khó như Tài khoản bị khóa hay Tài khoản không tồn tại trở nên cực kỳ đơn giản mà không cần phải thực thi truy vấn INSERT/UPDATE dữ liệu thật trong CSDL. 
* **Xác minh hành vi (Behavior Verification):** Nhờ các hàm kiểm tra tương tác như `then().shouldHaveNoInteractions()`, bộ test không chỉ kiểm tra dữ liệu đầu ra (Output) mà còn đảm bảo các luồng kiểm tra tối ưu (ví dụ: Tên đăng nhập trống thì không gọi xuống CSDL).
