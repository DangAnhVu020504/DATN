# Áp dụng kỹ thuật Mocking theo tài liệu mẫu vào dự án Speed Delivery

## Bối cảnh

Tài liệu mẫu `Tai_lieu_Unit_Test_Login.md` trình bày cách viết Unit Test cho chức năng đăng nhập sử dụng kỹ thuật Mocking với **BDDMockito** theo cấu trúc:
1. Phân tích đối tượng thực nghiệm (Class Under Test + Dependencies)
2. Thiết kế bảng kịch bản Test Cases
3. Viết test theo pattern: **Arrange → Act → Assert → Verify** sử dụng `given/willReturn`, `then/should`, `shouldHaveNoInteractions`

## Phân tích hiện trạng

Dự án đã có file [AuthServiceImplTest.java](file:///c:/Users/ANHVU/LEARNING/DATN/DATN-Project/speed-backend/src/test/java/com/speed/delivery/service/impl/AuthServiceImplTest.java) với 22 test cases, **nhưng** file test hiện tại:
- Trộn lẫn style `when/thenReturn` (Mockito classic) và `given/willReturn` (BDDMockito)
- Chưa sử dụng nhất quán pattern `then().should()` / `shouldHaveNoInteractions()` để verify behavior
- Thiếu comment chi tiết giải thích từng bước Arrange/Act/Assert/Verify
- Thiếu các verify `shouldHaveNoInteractions()` khi các dependency không nên bị gọi

## Proposed Changes

### Viết lại AuthServiceImplTest.java theo phong cách mẫu

#### [MODIFY] [AuthServiceImplTest.java](file:///c:/Users/ANHVU/LEARNING/DATN/DATN-Project/speed-backend/src/test/java/com/speed/delivery/service/impl/AuthServiceImplTest.java)

Refactor toàn bộ file test theo phong cách tài liệu mẫu:

1. **BDDMockito thuần túy**: Thay thế tất cả `when/thenReturn` → `given/willReturn`, `verify()` → `then().should()`
2. **Comment chi tiết**: Mỗi test có comment `// Arrange`, `// Act`, `// Assert`, `// Verify` rõ ràng
3. **shouldHaveNoInteractions()**: Khi validate thất bại sớm → verify rằng các dependency phía sau KHÔNG bị gọi
4. **Consistent @DisplayName**: Đánh mã TC01-TC22 tương ứng bảng kịch bản
5. **Behavior Verification**: Xác minh thứ tự gọi và số lần gọi bằng `times(1)`, `never()`

Bảng kịch bản (22 Test Cases):

| Nhóm | Mã TC | Tên kịch bản | Đầu vào | Mock Data | Kết quả mong đợi |
|---|---|---|---|---|---|
| **Register** | TC01 | Đăng ký thành công | email, password, fullName, phone, role="CUSTOMER" | existsByEmail→false, existsByPhone→false, findByName→Role | Trả về JwtResponse hợp lệ |
| | TC02 | Email trùng lặp | email đã tồn tại | existsByEmail→true | DuplicateResourceException |
| | TC03 | SĐT trùng lặp | SĐT đã tồn tại | existsByEmail→false, existsByPhone→true | DuplicateResourceException |
| | TC04 | Role không tồn tại | role="INVALID" | findByName→empty | ResourceNotFoundException |
| | TC05 | ArgumentCaptor kiểm tra User saved | Dữ liệu hợp lệ | Mock đầy đủ | Capture User có email đúng |
| **Login** | TC06 | Đăng nhập thành công | email, password hợp lệ | authenticate→ok, findByEmail→User active | JwtResponse hợp lệ + audit log |
| | TC07 | Sai mật khẩu | password sai | authenticate→BadCredentialsException | BadCredentialsException |
| | TC08 | Tài khoản bị vô hiệu hóa | email đúng | authenticate→ok, user.isActive=false | UnauthorizedException |
| | TC09 | User không tồn tại | email sai | authenticate→ok, findByEmail→empty | ResourceNotFoundException |
| | TC10 | InOrder kiểm tra thứ tự gọi | Dữ liệu hợp lệ | Mock đầy đủ | authenticate → findByEmail → generateAccessToken |
| **Refresh** | TC11 | Refresh thành công | refresh token hợp lệ | findByToken→stored, chưa hết hạn | JwtResponse mới + revoke token cũ |
| | TC12 | Token không hợp lệ | token sai | findByToken→empty | UnauthorizedException |
| | TC13 | Token hết hạn | token hết hạn | findByToken→expired | UnauthorizedException |
| **Password** | TC14 | Quên mật khẩu - gửi OTP | email hợp lệ | findByEmail→user | OTP được generate và gửi email |
| | TC15 | Quên mật khẩu - email không tồn tại | email sai | findByEmail→empty | ResourceNotFoundException |
| | TC16 | Reset mật khẩu thành công | email, OTP, newPassword | verifyOtp→true | Mật khẩu được encode và save |
| | TC17 | Reset mật khẩu - OTP sai | OTP sai | verifyOtp→false | BadRequestException |
| | TC18 | Đổi mật khẩu thành công | currentPassword, newPassword | matches→true | Mật khẩu mới được save |
| | TC19 | Đổi mật khẩu - sai mật khẩu cũ | currentPassword sai | matches→false | BadRequestException |
| **Logout** | TC20 | Logout revoke token | email, refreshToken | findByToken→stored | Token bị revoke |
| | TC21 | Logout token không tồn tại | token không hợp lệ | findByToken→empty | Không throw exception |
| **Profile** | TC22 | Get profile thành công | email | findByEmail→user | UserResponse hợp lệ |

## Verification Plan

### Automated Tests
```bash
cd speed-backend
mvn test -pl . -Dtest=AuthServiceImplTest -Djacoco.skip=true
```

Kỳ vọng: **22/22 tests PASSED**, thời gian thực thi < 500ms (không cần khởi tạo Spring Context).
