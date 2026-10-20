# Sinh bao cao docx: thiet ke ma tran kiem thu va cac tieu chi do luong
# Moi so lieu trong bao cao deu lay tu nhat ky chay that trong thu muc bang_chung_so_lieu
$ErrorActionPreference = 'Stop'

$outPath = 'C:\Users\ANHVU\LEARNING\DATN\DATN-Project\Thiet_ke_ma_tran_kiem_thu_va_tieu_chi_do_luong.docx'

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Add()

# Thiet lap trang A4, le 2,5 cm trai va 2 cm phai
$ps = $doc.PageSetup
$ps.PageWidth = $word.CentimetersToPoints(21)
$ps.PageHeight = $word.CentimetersToPoints(29.7)
$ps.TopMargin = $word.CentimetersToPoints(2)
$ps.BottomMargin = $word.CentimetersToPoints(2)
$ps.LeftMargin = $word.CentimetersToPoints(2.5)
$ps.RightMargin = $word.CentimetersToPoints(2)

$fontName = 'Times New Roman'
$bodySize = 13
$tblSize = 10
$hsizes = @{ 1 = 15; 2 = 14; 3 = 13 }

# Kieu chu chuan cua than bai: khong to mau, khong in dam
$normal = $doc.Styles.Item(-1)
$normal.Font.Name = $fontName
$normal.Font.Size = $bodySize
$normal.Font.Bold = 0
$normal.Font.Color = 0
$normal.ParagraphFormat.SpaceAfter = 6
$normal.ParagraphFormat.LineSpacingRule = 0

# Tieu de cac muc: chu den, khong dung mau xanh mac dinh cua Word
foreach ($lvl in 1..3) {
    $st = $doc.Styles.Item(-1 - $lvl)
    $st.Font.Name = $fontName
    $st.Font.Size = $hsizes[$lvl]
    $st.Font.Bold = 1
    $st.Font.Italic = 0
    $st.Font.Color = 0
}

function End-Range() {
    $r = $doc.Content
    $r.Collapse(0)
    return $r
}

function New-Text([string]$text, [int]$styleId, [double]$size, [int]$bold, [double]$leftIndent, [double]$firstIndent, [double]$spaceAfter, [int]$alignment) {
    $rng = End-Range
    $rng.Text = $text + "`r"
    $p = $rng.Paragraphs.Item(1)
    $r = $p.Range
    $r.Style = $doc.Styles.Item($styleId)
    $r.Font.Name = $fontName
    $r.Font.Size = $size
    $r.Font.Bold = $bold
    $r.Font.Italic = 0
    $r.Font.Color = 0
    $r.ParagraphFormat.LeftIndent = $word.CentimetersToPoints($leftIndent)
    $r.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints($firstIndent)
    $r.ParagraphFormat.SpaceAfter = $spaceAfter
    $r.ParagraphFormat.SpaceBefore = 0
    $r.ParagraphFormat.Alignment = $alignment
    $r.ParagraphFormat.LineSpacingRule = 0
}

# Doan van thuong, can deu hai ben
function T([string]$s) { New-Text $s (-1) $bodySize 0 0 0 6 3 }
# Doan van khong can deu
function TL([string]$s) { New-Text $s (-1) $bodySize 0 0 0 6 0 }
# Tieu de muc
function H([string]$s, [int]$lvl) { New-Text $s (-1 - $lvl) $hsizes[$lvl] 1 0 0 8 0 }
# Dong liet ke bat dau bang dau gach ngang
function D([string]$s) { New-Text ('- ' + $s) (-1) $bodySize 0 1.0 -0.5 4 3 }
# Tieu de bao cao
function Title([string]$s) { New-Text $s (-1) 15 0 0 0 12 1 }

function Add-Table($headers, $rows, $widths) {
    $script:tblCount = [int]$script:tblCount + 1
    Write-Output ('Bang so ' + $script:tblCount + ': so dong du kien=' + ($rows.Count + 1) + ', so cot=' + $headers.Count)
    $pre = End-Range
    $pre.Text = "`r"
    $tbl = $doc.Tables.Add((End-Range), ($rows.Count + 1), $headers.Count)
    $tbl.Borders.InsideLineStyle = 1
    $tbl.Borders.OutsideLineStyle = 1
    $tbl.Range.Font.Name = $fontName
    $tbl.Range.Font.Size = $tblSize
    $tbl.Range.Font.Bold = 0
    $tbl.Range.Font.Italic = 0
    $tbl.Range.Font.Color = 0
    $tbl.Range.ParagraphFormat.SpaceAfter = 0
    $tbl.Range.ParagraphFormat.SpaceBefore = 0
    $tbl.Range.ParagraphFormat.LineSpacingRule = 0
    $tbl.Range.ParagraphFormat.Alignment = 0
    $tbl.AutoFitBehavior(0)
    try {
        for ($c = 0; $c -lt $widths.Count; $c++) {
            $tbl.Columns.Item($c + 1).Width = $word.CentimetersToPoints($widths[$c])
        }
    } catch {
        Write-Output ('  Loi dat chieu rong cot bang ' + $script:tblCount + ': ' + $_.Exception.Message)
        Write-Output ('  Thuc te: so dong=' + $tbl.Rows.Count + ', so cot=' + $tbl.Columns.Count)
        try {
            for ($rw = 1; $rw -le $tbl.Rows.Count; $rw++) {
                for ($c = 0; $c -lt $tbl.Columns.Count; $c++) {
                    $tbl.Cell($rw, $c + 1).Width = $word.CentimetersToPoints($widths[$c])
                }
            }
        } catch {
            Write-Output ('  Bo qua chieu rong chi tiet bang ' + $script:tblCount + ': ' + $_.Exception.Message)
        }
    }
    for ($c = 0; $c -lt $headers.Count; $c++) {
        $tbl.Cell(1, $c + 1).Range.Text = [string]$headers[$c]
    }
    for ($r = 0; $r -lt $rows.Count; $r++) {
        for ($c = 0; $c -lt $headers.Count; $c++) {
            $tbl.Cell($r + 2, $c + 1).Range.Text = [string]$rows[$r][$c]
        }
    }
    $tbl.Rows.Item(1).HeadingFormat = -1
    $sp = End-Range
    $sp.Text = "`r"
    $spRange = $sp.Paragraphs.Item(1).Range
    $spRange.Font.Size = 8
    $spRange.Font.Bold = 0
    $spRange.ParagraphFormat.SpaceAfter = 6
}

$script:tblCount = 0
$w5 = @(2.0, 1.6, 5.0, 4.2, 3.7)
$w4 = @(2.0, 1.8, 6.2, 6.5)

# Loai bo cac bi danh trung ten voi ham tu dinh nghia (vi du bi danh H cua Get-History)
foreach ($n in @('Title', 'T', 'TL', 'D', 'H', 'Add-Table', 'New-Text')) {
    if (Get-Alias -Name $n -ErrorAction SilentlyContinue) {
        Remove-Item -Path ('Alias:' + $n) -Force
    }
}

# ================= TIEU DE VA THONG TIN CHUNG =================
Title 'Thiết kế ma trận kiểm thử và các tiêu chí đo lường cho bộ kiểm thử đơn vị dự án Speed Delivery'
D 'Đề tài: nghiên cứu và ứng dụng kỹ thuật giả lập trong kiểm thử đơn vị phần mềm.'
D 'Sinh viên thực hiện: Đặng Anh Vũ, mã số 4551190066.'
D 'Thời điểm đo số liệu: ngày 18 tháng 10 năm 2026 (lần đo gốc ngày 30 tháng 9 năm 2026 được đo lại và mở rộng). Môi trường đo: Windows 11, JDK 21.0.10, Apache Maven 3.9.16, dịch vụ MySQL80 đang chạy nhưng bộ kiểm thử không kết nối tới.'
D 'Bằng chứng số liệu: thư mục bang_chung_so_lieu chứa các nhật ký chạy kiểm thử và tệp độ bao phủ của lần đo.'

H '1. Thông tin chung về bộ kiểm thử' 1
H '1.1. Đối tượng kiểm thử và phạm vi báo cáo' 2
T 'Báo cáo trình bày hai nội dung phục vụ phần thực nghiệm của khóa luận. Nội dung thứ nhất là thiết kế ma trận kiểm thử cho bộ kiểm thử đơn vị, chia theo ba loại đường dẫn gồm đường dẫn thuận lợi, trường hợp biên và đường dẫn ngoại lệ. Nội dung thứ hai là xác định và đo ba tiêu chí đánh giá hiệu quả của bộ kiểm thử gồm thời gian chạy, độ bao phủ mã nguồn và tính độc lập của kiểm thử.'
T 'Đối tượng kiểm thử là tầng nghiệp vụ của hệ thống giao hàng nhanh Speed Delivery, cụ thể gồm 12 lớp nghiệp vụ trong gói com.speed.delivery.service.impl là xác thực, đơn hàng, thanh toán, mã giảm giá, tính giá, khoảng cách, khách hàng, tài xế, quản trị, thông báo, đánh giá và ví tài xế; thêm 2 lớp thuộc gói bảo mật là JwtTokenProvider và CustomUserDetailsService cùng 1 lớp kiểm thử khởi động ứng dụng là SpeedApplicationTest.'
T 'Công nghệ sử dụng được khai báo trong tệp speed-backend/pom.xml gồm Java 21, Spring Boot 3.4.1, JUnit 5, Mockito theo phong cách BDDMockito, AssertJ, JaCoCo 0.8.12 và Maven Surefire 3.5.2.'
T 'Phạm vi số liệu chỉ gồm bộ kiểm thử đơn vị có áp dụng kỹ thuật giả lập nằm trong thư mục speed-backend/src/test/java. Hai lớp trong gói com.speed.delivery.demo gồm một lớp dùng giả lập và một lớp nạp Spring context cùng cơ sở dữ liệu H2 chỉ dùng để đối chứng, được tách riêng khi tính số liệu của bộ kiểm thử đơn vị.'

H '1.2. Bộ kiểm thử hiện có' 2
T 'Bảng dưới đây liệt kê 15 lớp kiểm thử đơn vị, số phương thức kiểm thử, số lượt chạy thực tế do Maven Surefire ghi nhận và số đối tượng phụ thuộc được thay bằng đối tượng giả lập. Số phương thức và số lượt chạy được đếm trực tiếp từ mã nguồn kiểm thử và từ báo cáo trong thư mục target/surefire-reports.'
$h = @('Lớp kiểm thử', 'Số phương thức', 'Số lượt chạy', 'Số đối tượng phụ thuộc được giả lập')
$r = @(
    @('AuthServiceImplTest', '26', '26', '11'),
    @('OrderServiceImplTest', '17', '17', '10'),
    @('PaymentServiceImplTest', '10', '10', '2'),
    @('VoucherServiceImplTest', '18', '18', '1'),
    @('WalletServiceImplTest', '16', '16', '3'),
    @('PricingServiceImplTest', '16', '22', '0'),
    @('DistanceServiceImplTest', '9', '10', '0'),
    @('CustomerServiceImplTest', '12', '12', '4'),
    @('DriverServiceImplTest', '18', '18', '5'),
    @('AdminServiceImplTest', '10', '10', '5'),
    @('NotificationServiceImplTest', '7', '7', '1'),
    @('ReviewServiceImplTest', '7', '7', '5'),
    @('JwtTokenProviderTest', '10', '10', '0'),
    @('CustomUserDetailsServiceTest', '5', '5', '1'),
    @('SpeedApplicationTest', '1', '1', '0'),
    @('Tổng của 15 lớp', '182', '189', '48')
)
Add-Table $h $r @(5.0, 2.6, 2.4, 6.5)
D 'Hai lớp PricingServiceImplTest và DistanceServiceImplTest là lớp thuần logic nên không cần đối tượng giả lập, được kiểm thử trực tiếp để tránh lạm dụng kỹ thuật giả lập.'
D 'Ba phương thức dùng chú thích ParameterizedTest nên số lượt chạy (189) lớn hơn số phương thức (182).'
D 'Toàn bộ mã nguồn kiểm thử khai báo 48 mối phụ thuộc được thay bằng đối tượng giả lập bằng chú thích Mock và 11 lớp cần kiểm thử được tiêm bằng InjectMocks.'
D 'Khi chạy lệnh mvn test không lọc lớp, Maven thực thi 194 lượt gồm 189 lượt của bộ kiểm thử đơn vị và 5 lượt của hai lớp đối chứng trong gói com.speed.delivery.demo. Kết quả ghi nhận: Tests run: 194, Failures: 0, Errors: 0, Skipped: 0 và BUILD SUCCESS.'

H '1.3. Nguồn số liệu và cách tái lập kết quả' 2
T 'Nguyên tắc của báo cáo là chỉ trình bày số liệu đo được từ các lần chạy thật của bộ kiểm thử, không dùng số liệu ước lượng. Các nguồn dẫn chứng cụ thể như sau.'
D 'Nhật ký chạy toàn bộ 194 lượt (gồm 189 lượt kiểm thử đơn vị và 5 lượt của hai lớp đối chứng) kèm kiểm tra chất lượng và sinh báo cáo độ bao phủ: tệp bang_chung_so_lieu/ket_qua_verify_mocking.log. Lệnh chạy: mvn clean verify. Kết quả trong nhật ký: Tests run: 194, Failures: 0, Errors: 0, Skipped: 0, BUILD SUCCESS, tổng thời gian 01:44 phút.'
D 'Câu lệnh cụ thể đã dùng, thực hiện tại thư mục speed-backend: mvn -Dtest=SpeedApplicationTest,AuthServiceImplTest,OrderServiceImplTest,PaymentServiceImplTest,VoucherServiceImplTest,PricingServiceImplTest,DistanceServiceImplTest,CustomerServiceImplTest,DriverServiceImplTest,AdminServiceImplTest,NotificationServiceImplTest,ReviewServiceImplTest,JwtTokenProviderTest,CustomUserDetailsServiceTest,WalletServiceImplTest test'
D 'Câu lệnh kiểm chứng tính độc lập: mvn -Dtest=AuthServiceImplTest -Djacoco.skip=true test; mvn -Dtest=AuthServiceImplTest$RegisterTests#register_Success -Djacoco.skip=true test; và mvn với tham số lọc 15 lớp cùng tham số -Djunit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random -Djacoco.skip=true test để chạy theo thứ tự ngẫu nhiên.'
D 'Nhật ký lần chạy đối chứng gốc: tệp bang_chung_so_lieu/run_163_toan_bo_co_demo.log (lần đo ngày 30 tháng 9 năm 2026). Lần đo lại ngày 18 tháng 10 năm 2026 ghi nhận trong tệp ket_qua_verify_mocking.log; nhật ký này cũng chứa các dòng số liệu do hai lớp đối chứng tự in ra.'
D 'Nhật ký kiểm chứng tính độc lập (đo ngày 18 tháng 10 năm 2026): tệp bang_chung_so_lieu/run_le_auth_189.log cho lệnh chạy riêng lớp xác thực, tệp bang_chung_so_lieu/run_le_1method_189.log cho lệnh chạy riêng một phương thức kiểm thử, tệp bang_chung_so_lieu/run_thu_tu_ngau_nhien_189.log cho lần chạy lại toàn bộ với thứ tự phương thức ngẫu nhiên.'
D 'Số liệu thời gian chạy của từng lớp được đọc từ cột Time elapsed trong thư mục target/surefire-reports; tổng thời gian toàn lệnh được đọc từ dòng Total time của nhật ký chạy.'
D 'Số liệu độ bao phủ được đọc từ tệp target/site/jacoco/jacoco.csv do JaCoCo sinh ra; bản lưu của lần đo ngày 18 tháng 10 năm 2026 là tệp bang_chung_so_lieu/jacoco_do_bao_phu_194.csv.'
D 'Bảng ma trận kiểm thử ở mục 2 được đối chiếu với hai tài liệu đã có trong dự án là BAO_CAO_THIET_KE_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md và MA_TRAN_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md, đồng thời kiểm tra lại trực tiếp trong mã nguồn kiểm thử.'
D 'Lưu ý về độ biến thiên: thời gian chạy phụ thuộc trạng thái máy vì lần chạy đầu phải nạp lớp vào bộ nhớ. Ba lệnh kiểm chứng độc lập (chạy riêng một lớp, chạy riêng một phương thức, chạy lại toàn bộ theo thứ tự ngẫu nhiên) có tổng thời gian toàn lệnh Maven lần lượt là 17,099 giây, 14,302 giây và 20,554 giây, phần lớn dành cho việc nạp lớp lần đầu. Mục 3 trình bày số liệu của lần chạy đầy đủ ngày 18 tháng 10 năm 2026 vì đó là lần có đầy đủ nhật ký và tệp độ bao phủ được lưu lại.'
# ================= MUC 2: THIET KE MA TRAN KIEM THU =================
H '2. Thiết kế ma trận kiểm thử theo ba loại đường dẫn' 1
H '2.1. Ba loại đường dẫn kiểm thử' 2
T 'Ma trận kiểm thử được thiết kế theo ba loại đường dẫn tương ứng với các kỹ thuật thiết kế kiểm thử phổ biến là kiểm thử giá trị hợp lệ, phân tích giá trị biên kết hợp phân hoạch tương đương và kiểm thử phủ định kết hợp phán đoán lỗi. Cách phân loại này giúp bảo đảm mỗi chức năng đều được kiểm chứng ở cả luồng thành công, ở các giá trị biên và ở các tình huống lỗi.'
$h = @('Loại đường dẫn', 'Cơ sở thiết kế', 'Định nghĩa áp dụng cho bộ kiểm thử')
$r = @(
    @('Đường dẫn thuận lợi (happy path)', 'Kiểm thử với dữ liệu hợp lệ', 'Luồng nghiệp vụ thành công với dữ liệu hợp lệ; đối tượng giả lập trả về giá trị chuẩn để kiểm tra logic xử lý chính.'),
    @('Trường hợp biên (edge case)', 'Phân tích giá trị biên và phân hoạch tương đương', 'Đầu vào hoặc trạng thái ở mức biên như 0, số âm, giá trị rỗng, đúng ngưỡng, vượt ngưỡng, trùng lặp, hết hạn, không tìm thấy; hệ thống phải xử lý an toàn và không ném ngoại lệ ngoài dự kiến.'),
    @('Đường dẫn ngoại lệ (exception path)', 'Kiểm thử phủ định và phán đoán lỗi', 'Ngoại lệ được kỳ vọng khi đối tượng phụ thuộc báo lỗi hoặc khi dữ liệu vi phạm quy tắc nghiệp vụ; yêu cầu dừng sớm và không phát sinh tác dụng phụ.')
)
Add-Table $h $r @(3.6, 4.0, 8.9)
T 'Ngoài ba loại đường dẫn trên, kỹ thuật kiểm thử chuyển đổi trạng thái còn được áp dụng cho vòng đời của đơn hàng, từ trạng thái chờ xử lý sang đã xác nhận, đã gán tài xế, đang giao, đã giao hoặc đã hủy. Các kiểm thử cập nhật trạng thái đúng luồng thuộc đường dẫn thuận lợi, còn cập nhật sai luồng thuộc đường dẫn ngoại lệ.'

H '2.2. Kỹ thuật giả lập tương ứng với từng loại đường dẫn' 2
T 'Vai trò của kỹ thuật giả lập là tạo ra được các tình huống biên và tình huống lỗi một cách có kiểm soát, điều gần như không thể thực hiện nếu phải dùng đối tượng thật như cơ sở dữ liệu, cổng thanh toán hoặc máy chủ gửi thư. Bảng dưới đây thống kê số lần xuất hiện của từng kỹ thuật trong mã nguồn kiểm thử đơn vị, số liệu được đếm trực tiếp trên 15 tệp kiểm thử.'
$h = @('Kỹ thuật trong mã nguồn kiểm thử', 'Số lần xuất hiện', 'Loại đường dẫn sử dụng chính')
$r = @(
    @('Thiết lập giá trị trả về cho đối tượng giả lập bằng given và willReturn', '268', 'Đường dẫn thuận lợi và trường hợp biên'),
    @('Khẳng định kết quả bằng assertThat', '222', 'Cả ba loại đường dẫn'),
    @('Kiểm chứng tương tác bằng then và should', '184', 'Cả ba loại đường dẫn'),
    @('Khẳng định có ngoại lệ bằng assertThatThrownBy', '64', 'Đường dẫn ngoại lệ'),
    @('Bắt đối tượng truyền vào bằng ArgumentCaptor', '37', 'Đường dẫn thuận lợi và trường hợp biên'),
    @('Kiểm chứng không có tương tác bằng shouldHaveNoInteractions', '46', 'Đường dẫn ngoại lệ, để chứng minh dừng sớm'),
    @('Kiểm chứng không được gọi bằng never', '30', 'Đường dẫn ngoại lệ và trường hợp biên'),
    @('Kiểm chứng thứ tự gọi bằng InOrder', '20', 'Đường dẫn thuận lợi'),
    @('Mô phỏng lỗi từ đối tượng phụ thuộc bằng willThrow', '1', 'Đường dẫn ngoại lệ')
)
Add-Table $h $r @(8.6, 2.9, 5.0)
D 'Số lần dùng willThrow chỉ là 1, đặt tại AuthServiceImplTest với ngoại lệ BadCredentialsException. Phần lớn đường dẫn ngoại lệ còn lại được tạo bằng cách cho đối tượng giả lập trả về trạng thái vi phạm quy tắc nghiệp vụ, ví dụ đơn hàng không đúng trạng thái, tài xế không sẵn sàng, mã giảm giá hết hạn hoặc đã hết lượt sử dụng.'
D 'Cấu trúc tổ chức kiểm thử trong dự án: 11 trong 15 lớp kiểm thử dùng chú thích ExtendWith với MockitoExtension để chạy thuần trên máy ảo Java mà không nạp Spring context; 14 tệp có phương thức dựng dữ liệu bằng BeforeEach; 41 lớp lồng nhau dùng chú thích Nested để nhóm kiểm thử theo chức năng con.'
H '2.3. Ma trận kiểm thử chi tiết theo từng nhóm chức năng' 2
T 'Mỗi bảng dưới đây là ma trận kiểm thử của một nhóm chức năng. Cột mã kiểm thử giữ theo mã đã dùng trong mã nguồn kiểm thử (tên hiển thị của từng phương thức), cột đường dẫn ghi loại đường dẫn theo ba loại đã định nghĩa ở mục 2.1. Toàn bộ test case trong các bảng đã được hiện thực và đều đạt trong lần chạy 189 lượt.'

H '2.3.1. Nhóm chức năng xác thực và tài khoản người dùng' 3
TL 'Lớp kiểm thử: AuthServiceImplTest, 26 lượt chạy, 11 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('TC01', 'Thuận lợi', 'Đăng ký tài khoản thành công', 'existsByEmail trả về false, existsByPhone trả về false, findByName trả về vai trò, save trả về người dùng, xác thực thành công, sinh được token', 'Trả về phản hồi chứa token truy cập và token làm mới, có gửi thư chào mừng'),
    @('TC02', 'Ngoại lệ', 'Đăng ký với email đã tồn tại', 'existsByEmail trả về true', 'Ném DuplicateResourceException và dừng sớm, không gọi tới kho vai trò'),
    @('TC03', 'Ngoại lệ', 'Đăng ký với số điện thoại đã tồn tại', 'existsByPhone trả về true', 'Ném DuplicateResourceException'),
    @('TC04', 'Ngoại lệ', 'Vai trò không tồn tại', 'findByName trả về rỗng', 'Ném ResourceNotFoundException'),
    @('TC05', 'Thuận lợi', 'Kiểm chứng đối tượng người dùng được lưu', 'Thiết lập đầy đủ đối tượng giả lập', 'Bắt được đối tượng người dùng đúng email và mật khẩu đã mã hóa'),
    @('TC06', 'Thuận lợi', 'Đăng nhập thành công', 'authenticate trả về đối tượng xác thực, findByEmail trả về người dùng đang hoạt động', 'Trả về token hợp lệ và ghi nhật ký hành động đăng nhập'),
    @('TC07', 'Ngoại lệ', 'Đăng nhập sai mật khẩu', 'authenticate ném BadCredentialsException', 'Ngoại lệ lan truyền ra ngoài và được xử lý thành lỗi không có quyền truy cập'),
    @('TC08', 'Ngoại lệ', 'Tài khoản bị vô hiệu hóa', 'authenticate thành công nhưng isActive trả về false', 'Ném UnauthorizedException và không sinh token'),
    @('TC09', 'Ngoại lệ', 'Người dùng không tồn tại', 'authenticate thành công, findByEmail trả về rỗng', 'Ném ResourceNotFoundException'),
    @('TC10', 'Thuận lợi', 'Kiểm chứng thứ tự gọi đối tượng phụ thuộc', 'Thiết lập đầy đủ đối tượng giả lập', 'Thứ tự đúng là xác thực, tìm người dùng, sinh token truy cập'),
    @('TC11', 'Thuận lợi', 'Làm mới token thành công', 'findByTokenAndIsRevokedFalse trả về bản ghi còn hạn', 'Trả về cặp token mới và thu hồi token cũ'),
    @('TC12', 'Ngoại lệ', 'Token làm mới không hợp lệ', 'findByToken trả về rỗng', 'Ném UnauthorizedException'),
    @('TC13', 'Ngoại lệ', 'Token làm mới đã hết hạn', 'Bản ghi token có thời điểm hết hạn nhỏ hơn thời điểm hiện tại', 'Thu hồi token và ném UnauthorizedException'),
    @('TC14', 'Thuận lợi', 'Quên mật khẩu và gửi mã xác thực', 'findByEmail trả về người dùng, generateOtp trả về mã 123456', 'Sinh mã xác thực, gửi thư và ghi nhật ký'),
    @('TC15', 'Ngoại lệ', 'Quên mật khẩu với email không tồn tại', 'findByEmail trả về rỗng', 'Ném ResourceNotFoundException'),
    @('TC16', 'Thuận lợi', 'Đặt lại mật khẩu thành công', 'verifyOtp trả về true', 'Mật khẩu mới được mã hóa và lưu, thu hồi toàn bộ token làm mới'),
    @('TC17', 'Ngoại lệ', 'Đặt lại mật khẩu với mã xác thực sai', 'verifyOtp trả về false', 'Ném BadRequestException'),
    @('TC18', 'Thuận lợi', 'Đổi mật khẩu thành công', 'matches trả về true', 'Mật khẩu mới được mã hóa, lưu và ghi nhật ký'),
    @('TC19', 'Ngoại lệ', 'Đổi mật khẩu với mật khẩu cũ sai', 'matches trả về false', 'Ném BadRequestException'),
    @('TC20', 'Thuận lợi', 'Đăng xuất và thu hồi token', 'findByToken trả về bản ghi token', 'Token bị thu hồi và ghi nhật ký hành động đăng xuất'),
    @('TC21', 'Biên', 'Đăng xuất với token không tồn tại', 'findByToken trả về rỗng', 'Không ném ngoại lệ, bỏ qua an toàn'),
    @('TC22', 'Thuận lợi', 'Lấy thông tin cá nhân thành công', 'findByEmail trả về người dùng', 'Trả về phản hồi đầy đủ thông tin và vai trò'),
    @('TC23', 'Biên', 'Đăng ký với vai trò tài xế', 'findByName trả về vai trò ROLE_DRIVER, hồ sơ tài xế được lưu', 'Người dùng và hồ sơ Driver được tạo, không tạo hồ sơ Customer'),
    @('TC24', 'Thuận lợi', 'Cập nhật hồ sơ với đủ ba trường', 'findByEmail trả về người dùng, existsByPhone trả về false', 'Cả ba trường được lưu kèm ghi nhật ký cập nhật'),
    @('TC25', 'Ngoại lệ', 'Cập nhật với số điện thoại trùng người khác', 'existsByPhone trả về true', 'Ném DuplicateResourceException và dừng sớm, không lưu và không ghi nhật ký'),
    @('TC26', 'Ngoại lệ', 'Cập nhật khi người dùng không tồn tại', 'findByEmail trả về rỗng', 'Ném ResourceNotFoundException và không lưu')
)
Add-Table $h $r $w5
H '2.3.2. Nhóm chức năng quản lý đơn hàng' 3
TL 'Lớp kiểm thử: OrderServiceImplTest, 17 lượt chạy, 10 đối tượng phụ thuộc được giả lập. Đây là lớp có nhiều phụ thuộc nhất trong dự án.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('ORD-01', 'Thuận lợi', 'Tạo đơn hàng thành công', 'findAll trả về khách hàng, calculateDistance trả về 5.0, chuỗi tính giá, thanh toán thành công, save trả về đơn hàng', 'Đơn hàng có trạng thái PENDING và mã bắt đầu bằng SPD; gọi đủ các bước tính giá, thanh toán, thông báo và ghi nhật ký'),
    @('ORD-02', 'Ngoại lệ', 'Khách hàng không tồn tại', 'customerRepository.findAll trả về danh sách rỗng', 'Ném ResourceNotFoundException'),
    @('ORD-03', 'Thuận lợi', 'Tạo đơn hàng có áp dụng mã giảm giá', 'validateVoucher trả về mã hợp lệ, applyVoucher trả về 5.000 đồng', 'Tổng tiền bằng giá gốc trừ phần giảm; đơn hàng được lưu kèm mã giảm giá'),
    @('ORD-04', 'Thuận lợi', 'Kiểm chứng đối tượng đơn hàng được lưu', 'Thiết lập đầy đủ đối tượng giả lập', 'Bắt được đơn hàng đúng khách hàng, địa chỉ, trạng thái PENDING và phí giao hàng'),
    @('ORD-05', 'Thuận lợi', 'Lấy đơn hàng theo mã định danh', 'findById trả về đơn hàng', 'Phản hồi khớp dữ liệu'),
    @('ORD-06', 'Ngoại lệ', 'Lấy đơn hàng theo mã định danh không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('ORD-07', 'Thuận lợi', 'Lấy đơn hàng theo mã đơn', 'findByOrderCode trả về đơn hàng', 'Phản hồi khớp dữ liệu'),
    @('ORD-08', 'Thuận lợi', 'Danh sách đơn hàng của khách hàng có phân trang', 'findByCustomerId trả về PageImpl', 'Trả về danh sách đúng số lượng'),
    @('ORD-09', 'Thuận lợi', 'Gán tài xế thành công', 'Đơn hàng ở trạng thái PENDING, tài xế có isAvailable bằng true', 'Đơn hàng chuyển sang ASSIGNED; tài xế chuyển sang BUSY và isAvailable bằng false'),
    @('ORD-10', 'Ngoại lệ', 'Gán tài xế cho đơn sai trạng thái', 'Đơn hàng ở trạng thái DELIVERED', 'Ném BadRequestException'),
    @('ORD-11', 'Ngoại lệ', 'Gán tài xế không sẵn sàng', 'isAvailable trả về false', 'Ném BadRequestException và không gán tài xế'),
    @('ORD-12', 'Thuận lợi', 'Kiểm chứng thông báo cho hai bên', 'Thiết lập đầy đủ đối tượng giả lập', 'Hàm gửi thông báo được gọi cho cả khách hàng và tài xế'),
    @('ORD-13', 'Thuận lợi', 'Cập nhật trạng thái từ PENDING sang CONFIRMED', 'findById và save trả về đơn hàng', 'Trạng thái thay đổi và ghi thêm lịch sử đơn hàng'),
    @('ORD-14', 'Thuận lợi', 'Cập nhật trạng thái từ IN_TRANSIT sang DELIVERED', 'Đơn hàng có gắn tài xế', 'Tài xế tăng số đơn đã giao, cộng thu nhập và trở về trạng thái sẵn sàng'),
    @('ORD-15', 'Ngoại lệ', 'Chuyển trạng thái sai luồng từ DELIVERED về PENDING', 'Không cần thiết lập thêm', 'Ném BadRequestException do ràng buộc của máy trạng thái'),
    @('ORD-16', 'Thuận lợi', 'Hủy đơn hàng thành công', 'findById trả về đơn hàng có gắn tài xế', 'Đơn hàng chuyển sang CANCELLED, giải phóng tài xế, gọi hoàn tiền và gửi thông báo hủy'),
    @('ORD-17', 'Ngoại lệ', 'Hủy đơn hàng đã giao', 'Đơn hàng ở trạng thái DELIVERED', 'Ném BadRequestException và không gọi hoàn tiền')
)
Add-Table $h $r $w5

H '2.3.3. Nhóm chức năng thanh toán' 3
TL 'Lớp kiểm thử: PaymentServiceImplTest, 10 lượt chạy, 2 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('PM-TC01', 'Thuận lợi', 'Thanh toán tiền mặt thành công', 'findById trả về đơn hàng, save trả về bản ghi thanh toán', 'Trạng thái PENDING, thời điểm thanh toán rỗng, hàm trả về true'),
    @('PM-TC02', 'Thuận lợi', 'Thanh toán chuyển khoản thành công', 'Đơn hàng hợp lệ', 'Trạng thái COMPLETED, có thời điểm thanh toán và mã giao dịch'),
    @('PM-TC03', 'Ngoại lệ', 'Đơn hàng không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('PM-TC04', 'Ngoại lệ', 'Số tiền bằng null', 'Đơn hàng hợp lệ', 'Ném PaymentFailedException'),
    @('PM-TC05', 'Ngoại lệ', 'Số tiền nhỏ hơn hoặc bằng 0', 'Thử lần lượt với số tiền âm và bằng 0', 'Ném PaymentFailedException'),
    @('PM-TC06', 'Thuận lợi', 'Kiểm chứng bản ghi thanh toán được lưu', 'Thiết lập đầy đủ đối tượng giả lập', 'Bắt được bản ghi đúng đơn hàng, số tiền và phương thức thanh toán'),
    @('PM-TC07', 'Thuận lợi', 'Hoàn tiền thành công', 'findByOrderId trả về bản ghi thanh toán', 'Trạng thái REFUNDED và hàm trả về true'),
    @('PM-TC08', 'Biên', 'Hoàn tiền khi không tìm thấy bản ghi', 'findByOrderId trả về rỗng', 'Hàm trả về false và không ném ngoại lệ'),
    @('PM-TC09', 'Thuận lợi', 'Lấy trạng thái thanh toán khi có bản ghi', 'Bản ghi thanh toán ở trạng thái COMPLETED', 'Trả về chuỗi COMPLETED'),
    @('PM-TC10', 'Biên', 'Lấy trạng thái thanh toán khi không có bản ghi', 'findByOrderId trả về rỗng', 'Trả về chuỗi NOT_FOUND và không ném ngoại lệ')
)
Add-Table $h $r $w5
H '2.3.4. Nhóm chức năng mã giảm giá' 3
TL 'Lớp kiểm thử: VoucherServiceImplTest, 18 lượt chạy, 1 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('VOU-01', 'Thuận lợi', 'Kiểm tra mã giảm giá hợp lệ', 'Mã đang hoạt động, còn thời hạn, còn lượt và đủ giá trị tối thiểu', 'Trả về mã giảm giá'),
    @('VOU-02', 'Ngoại lệ', 'Mã giảm giá không tồn tại', 'findByCode trả về rỗng', 'Ném ResourceNotFoundException'),
    @('VOU-03', 'Ngoại lệ', 'Mã giảm giá bị vô hiệu hóa', 'isActive trả về false', 'Ném BadRequestException'),
    @('VOU-04', 'Ngoại lệ', 'Mã giảm giá đã hết hạn', 'endDate nhỏ hơn thời điểm hiện tại', 'Ném VoucherExpiredException'),
    @('VOU-05', 'Ngoại lệ', 'Mã giảm giá chưa tới thời hạn hiệu lực', 'startDate lớn hơn thời điểm hiện tại', 'Ném VoucherExpiredException'),
    @('VOU-06', 'Ngoại lệ', 'Mã giảm giá đã hết lượt sử dụng', 'usedCount lớn hơn hoặc bằng usageLimit', 'Ném BadRequestException'),
    @('VOU-07', 'Ngoại lệ', 'Giá trị đơn hàng dưới mức tối thiểu', 'orderValue nhỏ hơn minOrderValue', 'Ném BadRequestException'),
    @('VOU-08', 'Thuận lợi', 'Áp mã giảm theo phần trăm', 'Loại giảm giá theo phần trăm và chưa vượt mức tối đa', 'Số tiền giảm bằng giá trị đơn hàng nhân tỉ lệ phần trăm'),
    @('VOU-09', 'Biên', 'Áp mã giảm theo phần trăm chạm mức trần', 'Số tiền giảm tính ra lớn hơn mức giảm tối đa', 'Số tiền giảm bị giới hạn đúng bằng mức tối đa'),
    @('VOU-10', 'Thuận lợi', 'Áp mã giảm theo số tiền cố định', 'Loại giảm giá cố định', 'Số tiền giảm bằng giá trị cấu hình của mã'),
    @('VOU-11', 'Thuận lợi', 'Lấy danh sách mã đang hoạt động', 'findActiveVouchers trả về danh sách', 'Trả về danh sách mã đang hoạt động'),
    @('VOU-12', 'Thuận lợi', 'Tạo mã giảm giá thành công', 'findByCode trả về rỗng, save trả về mã giảm giá', 'Mã giảm giá được lưu'),
    @('VOU-13', 'Ngoại lệ', 'Tạo mã giảm giá đã tồn tại', 'findByCode trả về mã đã có', 'Ném BadRequestException'),
    @('VOU-14', 'Thuận lợi', 'Lấy mã giảm giá theo mã định danh thành công', 'findById trả về mã giảm giá', 'Phản hồi khớp dữ liệu'),
    @('VOU-15', 'Ngoại lệ', 'Lấy mã giảm giá theo mã định danh không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('VOU-16', 'Thuận lợi', 'Lấy toàn bộ danh sách mã giảm giá', 'findAll trả về danh sách', 'Danh sách mã giảm giá đầy đủ'),
    @('VOU-17', 'Thuận lợi', 'Đổi trạng thái mã đang hoạt động sang vô hiệu hóa', 'isActive bằng true', 'isActive chuyển thành false và mã được lưu'),
    @('VOU-18', 'Thuận lợi', 'Đổi trạng thái mã đang vô hiệu sang hoạt động', 'isActive bằng false', 'isActive chuyển thành true và mã được lưu')
)
Add-Table $h $r $w5

H '2.3.5. Nhóm chức năng tính giá' 3
TL 'Lớp kiểm thử: PricingServiceImplTest, 17 phương thức chạy thành 22 lượt do có 3 phương thức dùng nhiều bộ dữ liệu. Lớp thuần logic nên không dùng đối tượng giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Dữ liệu vào', 'Kết quả kỳ vọng')
$r = @(
    @('PRI-01', 'Thuận lợi', 'Giá cơ bản cố định', '15.000 đồng'),
    @('PRI-02', 'Biên', 'Khoảng cách bằng 0 km', '0 đồng'),
    @('PRI-03', 'Thuận lợi', 'Khoảng cách 1 km', '5.000 đồng'),
    @('PRI-04', 'Thuận lợi', 'Bảng giá theo khoảng cách, chạy 4 lượt với 2 km, 5 km, 10 km và 0,5 km', '10.000, 25.000, 50.000 và 2.500 đồng'),
    @('PRI-05', 'Biên', 'Khối lượng bằng null', 'Phụ phí bằng 0, xử lý an toàn không phát sinh lỗi'),
    @('PRI-06', 'Biên', 'Khối lượng nhỏ hơn hoặc bằng 5 kg, thử với 3 kg', 'Phụ phí bằng 0'),
    @('PRI-07', 'Biên', 'Khối lượng đúng ngưỡng 5 kg', 'Phụ phí bằng 0 vì chưa vượt ngưỡng'),
    @('PRI-08', 'Thuận lợi', 'Khối lượng 6 kg, vượt ngưỡng 1 kg', '3.000 đồng'),
    @('PRI-09', 'Thuận lợi', 'Khối lượng 10 kg, vượt ngưỡng 5 kg', '15.000 đồng'),
    @('PRI-10', 'Biên', 'Bảng phụ phí theo khối lượng, chạy 4 lượt với 5,1 kg, 7 kg, 15 kg và 20 kg', '300, 6.000, 30.000 và 45.000 đồng; giá trị 5,1 kg là mức vừa vượt ngưỡng'),
    @('PRI-11', 'Thuận lợi', 'Tổng giá đơn hàng thông thường với 5 km và 2 kg', '40.000 đồng'),
    @('PRI-12', 'Thuận lợi', 'Tổng giá đơn hàng nặng với 10 km và 8 kg', '74.000 đồng'),
    @('PRI-13', 'Biên', 'Tổng giá ở mức thấp nhất với 0 km và 0 kg', '15.000 đồng, chỉ gồm giá cơ bản'),
    @('PRI-14', 'Thuận lợi', 'Thu nhập tài xế bằng 80 phần trăm giá trị đơn hàng, đơn 40.000 đồng', '32.000 đồng'),
    @('PRI-15', 'Biên', 'Thu nhập khi giá trị đơn hàng bằng 0', '0 đồng'),
    @('PRI-16', 'Thuận lợi', 'Thu nhập với đơn hàng giá trị lớn 100.000 đồng', '80.000 đồng')
)
Add-Table $h $r $w4

H '2.3.6. Nhóm chức năng tính khoảng cách' 3
TL 'Lớp kiểm thử: DistanceServiceImplTest, 9 phương thức chạy thành 10 lượt do có 1 phương thức dùng nhiều bộ dữ liệu. Lớp thuần toán học nên không dùng đối tượng giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Kết quả kỳ vọng')
$r = @(
    @('DIS-01', 'Biên', 'Hai điểm trùng nhau', 'Khoảng cách bằng 0 km'),
    @('DIS-02', 'Thuận lợi', 'Từ quận 1 tới quận 3 tại thành phố Hồ Chí Minh', 'Khoảng 3 tới 4 km'),
    @('DIS-03', 'Thuận lợi', 'Từ thành phố Hồ Chí Minh tới Hà Nội', 'Khoảng 1.200 km trong sai số cho phép'),
    @('DIS-04', 'Thuận lợi', 'Kiểm chứng công thức theo vĩ độ, chạy 2 lượt', 'Xấp xỉ 111,19 km cho mỗi độ vĩ'),
    @('DIS-05', 'Thuận lợi', 'Ước lượng thời gian cho 25 km', 'Khoảng 60 phút'),
    @('DIS-06', 'Thuận lợi', 'Ước lượng thời gian cho 5 km', 'Khoảng 12 phút'),
    @('DIS-07', 'Biên', 'Ước lượng thời gian cho 0 km', '0 phút'),
    @('DIS-08', 'Thuận lợi', 'Khoảng cách luôn dương khi hai điểm khác nhau', 'Giá trị lớn hơn 0'),
    @('DIS-09', 'Thuận lợi', 'Kiểm chứng tính đối xứng khi đổi chiều tính', 'Hai chiều cho kết quả bằng nhau')
)
Add-Table $h $r $w4
H '2.3.7. Nhóm chức năng hồ sơ khách hàng và địa chỉ' 3
TL 'Lớp kiểm thử: CustomerServiceImplTest, 12 lượt chạy, 4 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('CS-TC01', 'Thuận lợi', 'Lấy hồ sơ thành công', 'findByEmail trả về người dùng', 'Trả về phản hồi đầy đủ thông tin'),
    @('CS-TC02', 'Ngoại lệ', 'Lấy hồ sơ khi người dùng không tồn tại', 'findByEmail trả về rỗng', 'Ném ResourceNotFoundException'),
    @('CS-TC03', 'Thuận lợi', 'Cập nhật họ tên trong hồ sơ', 'save trả về người dùng', 'Tên mới được lưu và có ghi nhật ký'),
    @('CS-TC04', 'Ngoại lệ', 'Cập nhật số điện thoại trùng với người khác', 'existsByPhone trả về true', 'Ném DuplicateResourceException'),
    @('CS-TC05', 'Thuận lợi', 'Lấy danh sách địa chỉ', 'findByCustomerId trả về danh sách', 'Trả về danh sách địa chỉ với địa chỉ mặc định xếp trước'),
    @('CS-TC06', 'Thuận lợi', 'Thêm địa chỉ mới', 'save trả về địa chỉ', 'Bắt được địa chỉ gắn đúng khách hàng và lưu thành công'),
    @('CS-TC07', 'Thuận lợi', 'Thêm địa chỉ mặc định mới', 'Danh sách đã có địa chỉ mặc định cũ', 'Địa chỉ cũ chuyển thành không mặc định, địa chỉ mới được đặt làm mặc định'),
    @('CS-TC08', 'Thuận lợi', 'Cập nhật địa chỉ thành công', 'findById trả về địa chỉ đúng chủ sở hữu', 'Các trường được cập nhật và lưu'),
    @('CS-TC09', 'Ngoại lệ', 'Cập nhật địa chỉ của khách hàng khác', 'findById trả về địa chỉ của chủ khác', 'Ném BadRequestException và không gọi hàm lưu'),
    @('CS-TC10', 'Thuận lợi', 'Xóa địa chỉ thành công', 'Địa chỉ thuộc đúng chủ sở hữu', 'Hàm xóa được gọi đúng một lần'),
    @('CS-TC11', 'Ngoại lệ', 'Xóa địa chỉ của khách hàng khác', 'Địa chỉ thuộc chủ khác', 'Ném BadRequestException và không gọi hàm xóa'),
    @('CS-TC12', 'Thuận lợi', 'Đặt địa chỉ mặc định', 'findById trả về địa chỉ, danh sách có địa chỉ mặc định cũ', 'Địa chỉ mặc định cũ bị bỏ và địa chỉ mới được đặt, cả hai đều được lưu')
)
Add-Table $h $r $w5

H '2.3.8. Nhóm chức năng tài xế' 3
TL 'Lớp kiểm thử: DriverServiceImplTest, 18 lượt chạy, 5 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('DR-TC01', 'Thuận lợi', 'Bật trạng thái sẵn sàng nhận đơn', 'findById trả về tài xế đang ngoại tuyến', 'Trạng thái chuyển thành trực tuyến, isAvailable bằng true và ghi nhật ký'),
    @('DR-TC02', 'Thuận lợi', 'Tắt trạng thái sẵn sàng nhận đơn', 'Tài xế đang trực tuyến', 'Trạng thái chuyển thành ngoại tuyến và isAvailable bằng false'),
    @('DR-TC03', 'Ngoại lệ', 'Đổi trạng thái khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('DR-TC04', 'Thuận lợi', 'Nhận đơn hàng thành công', 'Tài xế đang sẵn sàng', 'Ủy quyền sang hàm gán tài xế của lớp đơn hàng và kiểm chứng lời gọi'),
    @('DR-TC05', 'Ngoại lệ', 'Nhận đơn hàng khi tài xế không sẵn sàng', 'isAvailable trả về false', 'Ném BadRequestException và không ủy quyền'),
    @('DR-TC06', 'Thuận lợi', 'Từ chối đơn hàng', 'Tài xế và đơn hàng hợp lệ', 'Ghi nhật ký hành động từ chối và gửi thông báo cho khách hàng'),
    @('DR-TC07', 'Thuận lợi', 'Hoàn thành giao hàng', 'Đơn hàng ở trạng thái IN_TRANSIT thuộc tài xế', 'Ủy quyền cập nhật trạng thái đơn sang DELIVERED'),
    @('DR-TC08', 'Ngoại lệ', 'Hoàn thành đơn hàng không thuộc tài xế', 'Đơn hàng của tài xế khác', 'Ném BadRequestException'),
    @('DR-TC09', 'Ngoại lệ', 'Hoàn thành đơn hàng chưa ở trạng thái đang giao', 'Đơn hàng ở trạng thái ASSIGNED', 'Ném BadRequestException'),
    @('DR-TC10', 'Thuận lợi', 'Lấy lịch sử giao hàng', 'findById thành công', 'Ủy quyền sang hàm lấy đơn hàng của tài xế'),
    @('DR-TC11', 'Thuận lợi', 'Lấy thu nhập của tài xế', 'totalEarnings trả về 800.000 đồng', 'Trả về đúng số tiền'),
    @('DR-TC12', 'Ngoại lệ', 'Lấy thu nhập khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('DR-TC13', 'Thuận lợi', 'Lấy hồ sơ tài xế thành công', 'findById trả về tài xế', 'Phản hồi đầy đủ các trường của hồ sơ'),
    @('DR-TC14', 'Ngoại lệ', 'Lấy hồ sơ khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('DR-TC15', 'Ngoại lệ', 'Nhận đơn hàng khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('DR-TC16', 'Ngoại lệ', 'Hoàn thành giao hàng khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('DR-TC17', 'Ngoại lệ', 'Lấy lịch sử giao hàng khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('DR-TC18', 'Ngoại lệ', 'Từ chối đơn hàng không tồn tại', 'findById của kho đơn hàng trả về rỗng', 'Ném ResourceNotFoundException')
)
Add-Table $h $r $w5
H '2.3.9. Nhóm chức năng quản trị' 3
TL 'Lớp kiểm thử: AdminServiceImplTest, 10 lượt chạy, 5 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('AD-TC01', 'Thuận lợi', 'Lấy số liệu tổng quan', 'Số lượng trả về 50, 30, 10, doanh thu 5 triệu đồng và thống kê theo trạng thái', 'Phản hồi đầy đủ 8 chỉ số'),
    @('AD-TC02', 'Biên', 'Doanh thu trả về null', 'calculateRevenueAfter trả về null', 'Thay bằng giá trị 0, không phát sinh lỗi giá trị rỗng'),
    @('AD-TC03', 'Thuận lợi', 'Danh sách người dùng có phân trang', 'findAll trả về PageImpl', 'Trả về trang người dùng đúng dữ liệu'),
    @('AD-TC04', 'Thuận lợi', 'Lấy người dùng theo mã định danh', 'findById trả về người dùng', 'Phản hồi khớp dữ liệu'),
    @('AD-TC05', 'Ngoại lệ', 'Người dùng không tìm thấy', 'findById trả về rỗng', 'Ném ResourceNotFoundException'),
    @('AD-TC06', 'Thuận lợi', 'Kích hoạt tài khoản', 'save trả về người dùng', 'isActive bằng true và ghi nhật ký hành động kích hoạt'),
    @('AD-TC07', 'Thuận lợi', 'Vô hiệu hóa tài khoản', 'save trả về người dùng', 'isActive bằng false và ghi nhật ký hành động vô hiệu hóa'),
    @('AD-TC08', 'Ngoại lệ', 'Đổi trạng thái khi người dùng không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException, không gọi hàm lưu và không ghi nhật ký'),
    @('AD-TC09', 'Thuận lợi', 'Xóa người dùng thành công', 'findById trả về người dùng', 'Hàm xóa được gọi một lần và có ghi nhật ký'),
    @('AD-TC10', 'Ngoại lệ', 'Xóa người dùng không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException, không gọi hàm xóa và không ghi nhật ký')
)
Add-Table $h $r $w5

H '2.3.10. Nhóm chức năng thông báo' 3
TL 'Lớp kiểm thử: NotificationServiceImplTest, 7 lượt chạy, 1 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('NF-TC01', 'Thuận lợi', 'Gửi thông báo thông thường', 'save trả về thông báo', 'Thông báo được lưu với isRead bằng false'),
    @('NF-TC02', 'Thuận lợi', 'Gửi thông báo cho đơn hàng', 'save trả về thông báo', 'Loại thông báo là ORDER và mã tham chiếu bằng mã đơn hàng'),
    @('NF-TC03', 'Thuận lợi', 'Kiểm chứng nội dung thông báo', 'Thiết lập đầy đủ đối tượng giả lập', 'Tiêu đề, nội dung và mã người dùng khớp dữ liệu đầu vào'),
    @('NF-TC04', 'Thuận lợi', 'Lấy danh sách thông báo có phân trang', 'findByUserId trả về PageImpl', 'Danh sách phản hồi đúng dữ liệu'),
    @('NF-TC05', 'Thuận lợi', 'Đánh dấu thông báo đã đọc', 'findById trả về thông báo', 'isRead bằng true và thông báo được lưu'),
    @('NF-TC06', 'Biên', 'Đánh dấu đã đọc khi không tìm thấy', 'findById trả về rỗng', 'Bỏ qua an toàn, không ném ngoại lệ và không lưu'),
    @('NF-TC07', 'Thuận lợi', 'Đếm số thông báo chưa đọc', 'countBy trả về 5', 'Trả về 5')
)
Add-Table $h $r $w5

H '2.3.11. Nhóm chức năng đánh giá' 3
TL 'Lớp kiểm thử: ReviewServiceImplTest, 7 lượt chạy, 5 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('RV-TC01', 'Thuận lợi', 'Đánh giá 5 sao thành công', 'Đơn hàng đã giao, đúng chủ, có gắn tài xế, existsByOrderId trả về false', 'Lưu đánh giá và cập nhật điểm trung bình của tài xế với hai chữ số thập phân'),
    @('RV-TC02', 'Ngoại lệ', 'Điểm đánh giá ngoài khoảng 1 tới 5', 'Thử lần lượt với điểm 0 và điểm 6', 'Ném BadRequestException'),
    @('RV-TC03', 'Ngoại lệ', 'Đánh giá trùng đơn hàng', 'existsByOrderId trả về true', 'Ném BadRequestException'),
    @('RV-TC04', 'Ngoại lệ', 'Đánh giá đơn hàng chưa giao', 'Đơn hàng ở trạng thái IN_TRANSIT', 'Ném BadRequestException'),
    @('RV-TC05', 'Ngoại lệ', 'Đánh giá đơn hàng không thuộc khách hàng', 'Đơn hàng thuộc chủ khác', 'Ném BadRequestException'),
    @('RV-TC06', 'Thuận lợi', 'Lấy đánh giá theo mã đơn hàng', 'findByOrderId trả về đánh giá', 'Phản hồi khớp dữ liệu'),
    @('RV-TC07', 'Ngoại lệ', 'Đánh giá không tìm thấy', 'findByOrderId trả về rỗng', 'Ném ResourceNotFoundException')
)
Add-Table $h $r $w5
H '2.3.12. Nhóm chức năng bảo mật và kiểm thử khởi động ứng dụng' 3
TL 'Lớp kiểm thử: JwtTokenProviderTest, 10 lượt chạy, không dùng đối tượng giả lập vì sinh và kiểm chứng token thật bằng khóa bí mật dùng riêng cho kiểm thử.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Kết quả kỳ vọng')
$r = @(
    @('JWT-01', 'Thuận lợi', 'Tạo token truy cập từ email', 'Token khác rỗng và kiểm chứng được'),
    @('JWT-02', 'Thuận lợi', 'Tạo token truy cập từ đối tượng xác thực', 'Token khác rỗng'),
    @('JWT-03', 'Thuận lợi', 'Tạo token làm mới', 'Token khác rỗng'),
    @('JWT-04', 'Thuận lợi', 'So sánh hai loại token', 'Token truy cập và token làm mới khác nhau'),
    @('JWT-05', 'Thuận lợi', 'Kiểm chứng token hợp lệ', 'Trả về true'),
    @('JWT-06', 'Biên', 'Token sai định dạng', 'Trả về false do bắt được lỗi định dạng'),
    @('JWT-07', 'Biên', 'Token rỗng', 'Trả về false do bắt được lỗi tham số'),
    @('JWT-08', 'Thuận lợi', 'Trích xuất email từ token', 'Trả về đúng email đã đưa vào'),
    @('JWT-09', 'Thuận lợi', 'Trích xuất giữ nguyên giá trị gốc', 'Khớp hoàn toàn giá trị ban đầu'),
    @('JWT-10', 'Thuận lợi', 'Lấy thời hạn hiệu lực của token làm mới', 'Trả về 604.800.000 mili giây theo cấu hình')
)
Add-Table $h $r $w4

TL 'Lớp kiểm thử: CustomUserDetailsServiceTest, 5 lượt chạy, 1 đối tượng phụ thuộc được giả lập. Lớp này có tên hiển thị tiếng Việt nhưng mã kiểm thử được đặt theo quy ước riêng của lớp.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Kết quả kỳ vọng')
$r = @(
    @('UD-TC01', 'Thuận lợi', 'Nạp thông tin người dùng thành công', 'enabled bằng true và quyền là ROLE_ADMIN'),
    @('UD-TC02', 'Biên', 'Tài khoản bị khóa', 'disabled bằng true và không ném ngoại lệ'),
    @('UD-TC03', 'Ngoại lệ', 'Người dùng không tồn tại', 'Ném UsernameNotFoundException'),
    @('UD-TC04', 'Thuận lợi', 'Người dùng có nhiều vai trò', 'Danh sách quyền chứa cả hai vai trò'),
    @('UD-TC05', 'Thuận lợi', 'Kiểm chứng kho dữ liệu chỉ được gọi một lần', 'Không phát sinh lời gọi thừa')
)
Add-Table $h $r $w4
TL 'Lớp kiểm thử khởi động: SpeedApplicationTest gồm 1 lượt chạy, kiểm tra lớp ứng dụng nạp được; kết quả đạt với thời gian 0,021 giây và không có lỗi.'

H '2.3.13. Nhóm chức năng ví tài xế' 3
TL 'Lớp kiểm thử: WalletServiceImplTest, 16 lượt chạy, 3 đối tượng phụ thuộc được giả lập.'
$h = @('Mã kiểm thử', 'Đường dẫn', 'Kịch bản kiểm thử', 'Thiết lập đối tượng giả lập', 'Kết quả kỳ vọng')
$r = @(
    @('WL-TC01', 'Thuận lợi', 'Lấy ví thành công khi ví đã tồn tại', 'findById trả về tài xế, findByDriverId trả về ví', 'Phản hồi đúng chủ và số dư, không tạo ví mới'),
    @('WL-TC02', 'Biên', 'Lấy ví khi chưa có ví thì tự tạo ví mới số dư 0', 'findByDriverId trả về rỗng, save trả về ví mới', 'Ví mới số dư 0 được lưu, kiểm chứng nội dung bằng ArgumentCaptor'),
    @('WL-TC03', 'Ngoại lệ', 'Lấy ví khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException và không chạm kho ví'),
    @('WL-TC04', 'Thuận lợi', 'Cộng thu nhập thành công', 'Ví tồn tại, save trả về ví', 'Số dư 500.000 cộng 32.000 thành 532.000; giao dịch loại EARNING đúng đơn hàng'),
    @('WL-TC05', 'Ngoại lệ', 'Cộng thu nhập với số tiền null', 'Không thiết lập', 'Ném BadRequestException và cả ba kho đều không được gọi'),
    @('WL-TC06', 'Ngoại lệ', 'Cộng thu nhập với số tiền bằng 0', 'Không thiết lập', 'Ném BadRequestException'),
    @('WL-TC07', 'Ngoại lệ', 'Cộng thu nhập với số tiền âm', 'Số tiền âm 1.000 đồng', 'Ném BadRequestException'),
    @('WL-TC08', 'Ngoại lệ', 'Cộng thu nhập khi tài xế không tồn tại', 'findById trả về rỗng', 'Ném ResourceNotFoundException và không lưu giao dịch'),
    @('WL-TC09', 'Biên', 'Cộng thu nhập khi ví chưa tồn tại thì tự tạo rồi cộng', 'findByDriverId trả về rỗng', 'Hàm lưu được gọi hai lần cho việc tạo ví và cập nhật, kèm một giao dịch'),
    @('WL-TC10', 'Thuận lợi', 'Lấy lịch sử giao dịch có phân trang', 'findByWalletId trả về PageImpl', 'Phản hồi đúng dữ liệu; mã đơn hàng bằng null khi giao dịch không gắn đơn'),
    @('WL-TC11', 'Ngoại lệ', 'Lấy lịch sử giao dịch khi chưa có ví', 'findByDriverId trả về rỗng', 'Ném ResourceNotFoundException'),
    @('WL-TC12', 'Thuận lợi', 'Rút tiền thành công', 'Ví đủ số dư', 'Số dư 500.000 trừ 100.000 còn 400.000; giao dịch loại WITHDRAWAL'),
    @('WL-TC13', 'Ngoại lệ', 'Rút tiền với số tiền null', 'Không thiết lập', 'Ném BadRequestException'),
    @('WL-TC14', 'Ngoại lệ', 'Rút tiền với số tiền không dương', 'Số tiền âm 50.000 đồng', 'Ném BadRequestException'),
    @('WL-TC15', 'Ngoại lệ', 'Rút tiền khi chưa có ví', 'findByDriverId trả về rỗng', 'Ném ResourceNotFoundException'),
    @('WL-TC16', 'Ngoại lệ', 'Rút tiền vượt quá số dư', 'Số dư 500.000, rút 600.000', 'Ném BadRequestException; số dư giữ nguyên và không lưu')
)
Add-Table $h $r $w5

H '2.4. Tổng hợp độ phủ ba loại đường dẫn' 2
T 'Bảng dưới đây tổng hợp số test case theo từng loại đường dẫn của 15 lớp kiểm thử. Số liệu được tổng hợp từ bảng phân loại đường dẫn của tài liệu BAO_CAO_THIET_KE_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md và đối chiếu với các bảng ma trận chi tiết ở mục 2.3; các phương thức dùng nhiều bộ dữ liệu được tính theo số lượt chạy nên tổng bằng 189 lượt.'
$h = @('Nhóm chức năng', 'Đường dẫn thuận lợi', 'Trường hợp biên', 'Đường dẫn ngoại lệ', 'Tổng số lượt')
$r = @(
    @('Xác thực và tài khoản', '11', '2', '13', '26'),
    @('Quản lý đơn hàng', '11', '0', '6', '17'),
    @('Thanh toán', '5', '2', '3', '10'),
    @('Mã giảm giá', '9', '1', '8', '18'),
    @('Tính giá', '15', '7', '0', '22'),
    @('Tính khoảng cách', '8', '2', '0', '10'),
    @('Khách hàng và địa chỉ', '8', '0', '4', '12'),
    @('Tài xế', '8', '0', '10', '18'),
    @('Ví tài xế', '4', '2', '10', '16'),
    @('Quản trị', '6', '1', '3', '10'),
    @('Thông báo', '6', '1', '0', '7'),
    @('Đánh giá', '2', '0', '5', '7'),
    @('Bảo mật token', '8', '2', '0', '10'),
    @('An toàn người dùng', '3', '1', '1', '5'),
    @('Khởi động ứng dụng', '1', '0', '0', '1'),
    @('Tổng cộng', '105', '21', '63', '189'),
    @('Tỉ lệ trên tổng số lượt', '55,6 phần trăm', '11,1 phần trăm', '33,3 phần trăm', '100 phần trăm')
)
Add-Table $h $r @(4.6, 3.0, 2.9, 3.0, 3.0)
D 'Bộ kiểm thử hiện tại mạnh ở đường dẫn thuận lợi với 55,6 phần trăm và đường dẫn ngoại lệ với 33,3 phần trăm, đây là đặc trưng khi áp dụng kỹ thuật giả lập vì có thể mô phỏng lỗi của đối tượng phụ thuộc một cách có kiểm soát.'
D 'Đường dẫn biên chỉ chiếm 11,1 phần trăm và tập trung ở các lớp thuần logic như tính giá, tính khoảng cách cùng các xử lý giá trị rỗng và tự tạo ví; ba nhóm quản lý đơn hàng, khách hàng và tài xế chưa có test case biên, cần bổ sung theo phần thiết kế bổ sung tại mục 3.15 của tài liệu BAO_CAO_THIET_KE_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md.'
# ================= MUC 3: THOI GIAN CHAY =================
H '3. Tiêu chí đo lường thứ nhất: thời gian chạy' 1
H '3.1. Cách xác định và cách đo' 2
T 'Thời gian chạy là tổng thời gian bộ kiểm thử thực thi. Chỉ số này quyết định độ trễ phản hồi của quy trình kiểm thử trên mỗi lần thay đổi mã nguồn, vì vậy đây là tiêu chí đầu tiên được đo.'
$h = @('Chỉ số', 'Cách xác định')
$r = @(
    @('Thời gian của từng lớp kiểm thử', 'Giá trị Time elapsed của từng lớp trong báo cáo Maven Surefire, đọc tại thư mục target/surefire-reports.'),
    @('Tổng thời gian tầng kiểm thử', 'Tổng các giá trị Time elapsed của 15 lớp kiểm thử tính theo lớp ngoài cùng, không cộng thêm phần của các lớp lồng nhau để tránh trùng số.'),
    @('Thời gian trung bình mỗi lượt', 'Lấy tổng thời gian tầng kiểm thử chia cho tổng số lượt chạy.'),
    @('Thời gian toàn lệnh Maven', 'Giá trị Total time trong nhật ký chạy, đã gồm thời gian kiểm tra biên dịch, chạy kiểm thử và sinh báo cáo độ bao phủ.')
)
Add-Table $h $r @(5.4, 11.1)
T 'Công cụ đo là Maven Surefire phiên bản 3.5.2 và JaCoCo phiên bản 0.8.12, cả hai được khai báo trong tệp speed-backend/pom.xml.'

H '3.2. Ngưỡng chấp nhận đề ra' 2
$h = @('Mã', 'Tiêu chí', 'Ngưỡng')
$r = @(
    @('TG-1', 'Tổng thời gian tầng kiểm thử của 189 lượt chạy', 'Không quá 30 giây'),
    @('TG-2', 'Thời gian trung bình mỗi lượt chạy', 'Không quá 200 mili giây'),
    @('TG-3', 'Thời gian của mỗi lớp kiểm thử', 'Không quá 5 giây'),
    @('TG-4', 'Khả năng chạy lặp lại cho cùng kết quả', 'Đạt 100 phần trăm qua các lần chạy')
)
Add-Table $h $r @(1.8, 8.2, 6.5)
T 'Các ngưỡng trên do đồ án đề ra dựa trên nguyên tắc giữ cho quá trình tích hợp liên tục luôn nhanh, vì mỗi lần thay đổi mã nguồn đều cần chạy lại toàn bộ kiểm thử.'

H '3.3. Kết quả đo của bộ kiểm thử đơn vị' 2
T 'Bảng dưới đây là thời gian của từng lớp kiểm thử trong lần chạy 189 lượt ngày 18 tháng 10 năm 2026, số liệu đọc từ cột Time elapsed của báo cáo Surefire và lưu trong tệp bang_chung_so_lieu/ket_qua_verify_mocking.log.'
$h = @('Lớp kiểm thử', 'Số lượt', 'Thời gian (giây)')
$r = @(
    @('OrderServiceImplTest', '17', '0,901'),
    @('WalletServiceImplTest', '16', '0,515'),
    @('DriverServiceImplTest', '18', '0,423'),
    @('AuthServiceImplTest', '26', '0,362'),
    @('VoucherServiceImplTest', '18', '0,356'),
    @('AdminServiceImplTest', '10', '0,333'),
    @('CustomerServiceImplTest', '12', '0,292'),
    @('JwtTokenProviderTest', '10', '0,266'),
    @('ReviewServiceImplTest', '7', '0,265'),
    @('DistanceServiceImplTest', '10', '0,263'),
    @('PaymentServiceImplTest', '10', '0,251'),
    @('NotificationServiceImplTest', '7', '0,245'),
    @('PricingServiceImplTest', '22', '0,136'),
    @('CustomUserDetailsServiceTest', '5', '0,092'),
    @('SpeedApplicationTest', '1', '0,021'),
    @('Tổng của 15 lớp', '189', '4,721')
)
Add-Table $h $r @(7.0, 2.5, 7.0)
D 'Tổng thời gian tầng kiểm thử của 189 lượt là 4,721 giây, tương đương 25,0 mili giây cho mỗi lượt.'
D 'Thời gian toàn lệnh Maven của lần đo ngày 18 tháng 10 năm 2026, đã gồm bước kiểm tra chất lượng và sinh báo cáo độ bao phủ, được nhật ký ghi nhận là 01:44 phút.'
D 'Lớp lâu nhất là OrderServiceImplTest với 0,901 giây; các lớp còn lại đều dưới 0,6 giây.'
D 'Lớp xác thực dù có 26 lượt chạy và 11 đối tượng phụ thuộc giả lập nhưng chỉ tốn 0,362 giây, cho thấy chi phí chủ yếu nằm ở lần nạp lớp đầu tiên chứ không nằm ở logic kiểm thử.'
D 'Kết quả chạy lặp: trong cùng buổi đo, bộ kiểm thử được chạy nhiều lần với các cấu hình khác nhau (có và không sinh báo cáo độ bao phủ, thứ tự ngẫu nhiên, chạy riêng từng lớp) và mọi lần đều đạt 189 trên 189 lượt, không có lỗi.'

H '3.4. Đối chứng giữa có và không dùng kỹ thuật giả lập' 2
T 'Hai lớp trong gói com.speed.delivery.demo kiểm thử cùng một luồng đăng nhập theo hai cách khác nhau: lớp MockingDemoTest thay toàn bộ 11 đối tượng phụ thuộc bằng đối tượng giả lập, còn lớp SpringContextDemoTest nạp toàn bộ Spring context cùng cơ sở dữ liệu H2 và tạo dữ liệu thật. Số liệu dưới đây đọc từ nhật ký bang_chung_so_lieu/ket_qua_verify_mocking.log.'
$h = @('Nội dung so sánh', 'Lớp có dùng kỹ thuật giả lập', 'Lớp không dùng kỹ thuật giả lập')
$r = @(
    @('Số lượt kiểm thử', '3', '2'),
    @('Thời gian chạy của lớp', '15,54 giây', '41,65 giây'),
    @('Thời gian khởi động nền tảng', 'Không phát sinh vì không nạp Spring context', '39.654 mili giây do lớp kiểm thử tự đo; nhật ký Spring ghi nhận Started in 31,835 giây'),
    @('Chi phí cho một lần đăng nhập', '693,06 micro giây, đo từ 10.000 lần đăng nhập hết 6.930 mili giây', '270,60 mili giây, đo từ 10 lần đăng nhập hết 2.706 mili giây'),
    @('Dữ liệu kiểm thử', 'Dựng trong bộ nhớ bằng đối tượng giả lập', 'Phải tạo thật trong cơ sở dữ liệu H2 trước khi kiểm thử')
)
Add-Table $h $r @(4.6, 5.9, 6.0)
D 'Từ hai số đo chi phí một lần đăng nhập, tỉ lệ chênh lệch tính theo công thức 270,60 chia cho 0,69306 xấp xỉ 390 lần; riêng thời gian khởi động nền tảng của lớp không dùng kỹ thuật giả lập là 39.654 mili giây, đã lớn hơn tổng thời gian tầng kiểm thử của cả 189 lượt kiểm thử đơn vị là 4,721 giây tới hơn 8 lần.'
D 'Hai lớp đối chứng này chỉ dùng để so sánh và không được tính vào số liệu của bộ 189 lượt kiểm thử đơn vị.'

H '3.5. Đánh giá tiêu chí thời gian chạy' 2
$h = @('Mã', 'Ngưỡng', 'Kết quả đo', 'Kết luận')
$r = @(
    @('TG-1', 'Tổng thời gian tầng kiểm thử không quá 30 giây', '4,721 giây', 'Đạt'),
    @('TG-2', 'Trung bình mỗi lượt không quá 200 mili giây', '25,0 mili giây', 'Đạt'),
    @('TG-3', 'Mỗi lớp kiểm thử không quá 5 giây', 'Lớn nhất 0,901 giây', 'Đạt'),
    @('TG-4', 'Chạy lặp lại cho cùng kết quả', 'Mọi lần chạy đều đạt 189 trên 189 lượt', 'Đạt')
)
Add-Table $h $r @(1.6, 5.4, 4.9, 4.6)
# ================= MUC 4: DO BAO PHU =================
H '4. Tiêu chí đo lường thứ hai: độ bao phủ mã nguồn' 1
H '4.1. Các chỉ số đo độ bao phủ và công cụ đo' 2
T 'Độ bao phủ mã nguồn cho biết tỉ lệ mã nghiệp vụ đã được bộ kiểm thử thực thi. Chỉ số thấp chứng tỏ còn phần mã chưa được kiểm chứng; tuy nhiên chỉ số cao không đồng nghĩa các khẳng định trong kiểm thử là chặt chẽ, vì vậy chỉ số này được dùng như chỉ báo về phạm vi bao phủ chứ không phải thước đo chất lượng của từng khẳng định.'
$h = @('Chỉ số', 'Ý nghĩa', 'Nguyên tắc tính')
$r = @(
    @('Độ bao phủ chỉ dẫn', 'Tỉ lệ chỉ dẫn của mã máy đã được thực thi', 'Số chỉ dẫn đã thực thi chia cho tổng số chỉ dẫn'),
    @('Độ bao phủ dòng', 'Tỉ lệ dòng mã nguồn đã được thực thi', 'Một dòng được coi là đã phủ nếu có ít nhất một chỉ dẫn trên dòng đó đã chạy'),
    @('Độ bao phủ nhánh', 'Tỉ lệ nhánh điều khiển đã đi qua cả hai hướng', 'Số nhánh đã đi qua chia cho tổng số nhánh, tính trên các cấu trúc rẽ nhánh và toán tử logic'),
    @('Độ bao phủ phương thức', 'Tỉ lệ phương thức đã được gọi ít nhất một lần', 'Số phương thức đã gọi chia cho tổng số phương thức')
)
Add-Table $h $r @(4.0, 6.0, 6.5)
D 'Công cụ đo là JaCoCo phiên bản 0.8.12, khai báo trong tệp speed-backend/pom.xml và chạy ở pha test; kết quả gồm trang giao diện target/site/jacoco/index.html và tệp số liệu thô target/site/jacoco/jacoco.csv.'
D 'Tệp pom.xml có khai báo bước kiểm tra chất lượng jacoco:check gắn với pha verify: áp dụng theo từng lớp, giới hạn trong danh sách 12 lớp nghiệp vụ trọng tâm và yêu cầu độ bao phủ dòng tối thiểu 90 phần trăm. Lệnh mvn clean verify của lần đo ngày 18 tháng 10 năm 2026 đã chạy qua bước kiểm tra này và đạt.'
D 'Lưu ý về phương pháp: công cụ ghi nối dữ liệu vào tệp target/jacoco.exec giữa các lần chạy, vì vậy số liệu độ bao phủ phải được đo trên một lần chạy sạch. Lần đo ngày 18 tháng 10 năm 2026 dùng lệnh mvn clean verify nên dữ liệu được đo sạch từ đầu; kết quả lưu tại tệp bang_chung_so_lieu/jacoco_do_bao_phu_194.csv.'

H '4.2. Ngưỡng chấp nhận đề ra' 2
$h = @('Mã', 'Tiêu chí', 'Ngưỡng', 'Nguồn ngưỡng')
$r = @(
    @('BP-1', 'Độ bao phủ dòng của từng lớp nghiệp vụ đã có kiểm thử', 'Từ 90 phần trăm trở lên', 'Quy tắc jacoco:check trong pom.xml, áp cho 12 lớp trọng tâm ở cấp lớp'),
    @('BP-2', 'Độ bao phủ nhánh của từng lớp nghiệp vụ có nhánh', 'Từ 85 phần trăm trở lên', 'Đề xuất của đồ án, đo tham khảo'),
    @('BP-3', 'Độ bao phủ dòng tổng hợp của 12 lớp nghiệp vụ đã có kiểm thử', 'Từ 95 phần trăm trở lên', 'Đề xuất của đồ án'),
    @('BP-4', 'Độ bao phủ dòng của toàn dự án gồm cả lớp điều khiển, lớp thực thể và lớp cấu hình', 'Từ 60 phần trăm trở lên', 'Đề xuất của đồ án'),
    @('BP-5', 'Số lớp nghiệp vụ còn ở mức 0 phần trăm', 'Không còn lớp nào', 'Đề xuất của đồ án')
)
Add-Table $h $r @(1.6, 6.6, 3.7, 4.6)

H '4.3. Kết quả đo độ bao phủ' 2
T 'Bảng dưới đây tổng hợp độ bao phủ theo phạm vi, số liệu rút từ tệp bang_chung_so_lieu/jacoco_do_bao_phu_194.csv của lần chạy 189 lượt kiểm thử đơn vị.'
$h = @('Phạm vi', 'Số lớp', 'Dòng đã phủ trên tổng', 'Tỉ lệ dòng', 'Nhánh đã phủ trên tổng', 'Tỉ lệ nhánh')
$r = @(
    @('Toàn dự án', '66', '976 trên 1.298', '75,2 phần trăm', '147 trên 222', '66,2 phần trăm'),
    @('Gói dịch vụ service.impl', '18', '816 trên 893', '91,4 phần trăm', '145 trên 204', '71,1 phần trăm'),
    @('12 lớp nghiệp vụ đã có kiểm thử', '12', '796 trên 814', '97,8 phần trăm', '145 trên 200', '72,5 phần trăm'),
    @('12 lớp nghiệp vụ cùng 2 lớp bảo mật', '14', '849 trên 871', '97,5 phần trăm', 'Không tính', 'Không tính')
)
Add-Table $h $r @(4.6, 1.5, 3.2, 2.3, 3.0, 1.9)
D 'Ngoài dòng và nhánh, độ bao phủ chỉ dẫn trên toàn dự án là 4.374 trên 5.821, đạt 75,1 phần trăm; độ bao phủ phương thức là 180 trên 309, đạt 58,3 phần trăm. Chỉ số phương thức thấp hơn vì phần lớn phương thức chưa được kiểm thử nằm ở các lớp thực thể và lớp điều khiển.'
T 'Bảng chi tiết theo từng lớp đã có kiểm thử như sau.'
$h = @('Lớp nghiệp vụ', 'Dòng đã phủ trên tổng', 'Tỉ lệ dòng', 'Nhánh đã phủ trên tổng', 'Tỉ lệ nhánh')
$r = @(
    @('WalletServiceImpl', '71 trên 71', '100 phần trăm', '12 trên 12', '100 phần trăm'),
    @('PaymentServiceImpl', '28 trên 28', '100 phần trăm', '8 trên 8', '100 phần trăm'),
    @('PricingServiceImpl', '19 trên 19', '100 phần trăm', '4 trên 4', '100 phần trăm'),
    @('DistanceServiceImpl', '12 trên 12', '100 phần trăm', 'Không có nhánh', 'Không tính'),
    @('NotificationServiceImpl', '41 trên 41', '100 phần trăm', 'Không có nhánh', 'Không tính'),
    @('AdminServiceImpl', '49 trên 49', '100 phần trăm', '5 trên 6', '83,3 phần trăm'),
    @('DriverServiceImpl', '56 trên 56', '100 phần trăm', '9 trên 10', '90,0 phần trăm'),
    @('VoucherServiceImpl', '37 trên 37', '100 phần trăm', '19 trên 20', '95,0 phần trăm'),
    @('CustomUserDetailsService', '10 trên 10', '100 phần trăm', '2 trên 2', '100 phần trăm'),
    @('AuthServiceImpl', '155 trên 155', '100 phần trăm', '25 trên 32', '78,1 phần trăm'),
    @('CustomerServiceImpl', '98 trên 102', '96,1 phần trăm', '21 trên 30', '70,0 phần trăm'),
    @('OrderServiceImpl', '188 trên 199', '94,5 phần trăm', '30 trên 64', '46,9 phần trăm'),
    @('ReviewServiceImpl', '42 trên 45', '93,3 phần trăm', '12 trên 14', '85,7 phần trăm'),
    @('JwtTokenProvider', '43 trên 47', '91,5 phần trăm', 'Không có nhánh', 'Không tính')
)
Add-Table $h $r @(4.2, 3.2, 2.6, 3.2, 2.8)
T 'Các lớp nghiệp vụ chưa có lớp kiểm thử riêng được liệt kê dưới đây; chúng chỉ được chạm tới gián tiếp qua hai lớp đối chứng trong gói demo nên độ bao phủ còn thấp, đây là khoảng trống cần bổ sung kiểm thử.'
$h = @('Lớp nghiệp vụ chưa có kiểm thử riêng', 'Dòng đã phủ trên tổng', 'Nhánh đã phủ trên tổng')
$r = @(
    @('AuditLogServiceImpl', '11 trên 31', 'Không có nhánh'),
    @('OTPServiceImpl', '1 trên 23', '0 trên 4'),
    @('EmailServiceImpl', '2 trên 8', 'Không có nhánh'),
    @('FileStorageServiceImpl', '2 trên 7', 'Không có nhánh'),
    @('MapServiceImpl', '2 trên 6', 'Không có nhánh'),
    @('SMSServiceImpl', '2 trên 4', 'Không có nhánh')
)
Add-Table $h $r @(6.5, 5.0, 5.0)
D 'So với lần đo trước, lớp WalletServiceImpl đã có lớp kiểm thử riêng và đạt 100 phần trăm dòng cùng 100 phần trăm nhánh nên không còn nằm trong danh sách này.'

H '4.4. Đánh giá tiêu chí độ bao phủ' 2
$h = @('Mã', 'Ngưỡng', 'Kết quả đo', 'Kết luận')
$r = @(
    @('BP-1', 'Từ 90 phần trăm dòng cho từng lớp nghiệp vụ', 'Cả 12 lớp đạt từ 93,3 tới 100 phần trăm', 'Đạt'),
    @('BP-2', 'Từ 85 phần trăm nhánh cho lớp có nhánh', 'Đạt ở ví, thanh toán, tính giá, tài xế, mã giảm giá và đánh giá; chưa đạt ở đơn hàng 46,9 phần trăm, xác thực 78,1 phần trăm, khách hàng 70,0 phần trăm và quản trị 83,3 phần trăm', 'Chưa đạt'),
    @('BP-3', 'Từ 95 phần trăm dòng cho 12 lớp nghiệp vụ', '97,8 phần trăm', 'Đạt'),
    @('BP-4', 'Từ 60 phần trăm dòng cho toàn dự án', '75,2 phần trăm', 'Đạt'),
    @('BP-5', 'Không còn lớp nghiệp vụ ở mức 0 phần trăm', 'Không còn lớp nào ở mức 0 phần trăm: ví đã có kiểm thử riêng; hai lớp nghiệp vụ chính còn độ bao phủ thấp là ghi nhật ký kiểm toán 11 trên 31 dòng và mã xác thực 1 trên 23 dòng', 'Đạt một phần')
)
Add-Table $h $r @(1.5, 4.4, 6.3, 4.3)
T 'Cần lưu ý khi diễn giải con số 75,2 phần trăm dòng của toàn dự án: chỉ số này bị kéo xuống bởi các lớp nằm ngoài phạm vi kiểm thử đơn vị như lớp điều khiển giao diện, lớp thực thể và lớp cấu hình. Tầng nghiệp vụ là đối tượng của kỹ thuật giả lập đạt 97,8 phần trăm dòng cho 12 lớp đã có kiểm thử. Khoảng trống còn lại tập trung vào 2 lớp chưa viết kiểm thử riêng là ghi nhật ký kiểm toán và mã xác thực, cùng các nhánh điều khiển của nhóm đơn hàng, xác thực và khách hàng.'
# ================= MUC 5: TINH DOC LAP =================
H '5. Tiêu chí đo lường thứ ba: tính độc lập của kiểm thử' 1
H '5.1. Định nghĩa và các chỉ báo kiểm chứng' 2
T 'Tính độc lập của kiểm thử được hiểu là mỗi test case cho cùng một kết quả bất kể môi trường bên ngoài có bật hay tắt, bất kể các test case khác có chạy trước hay không và bất kể thứ tự chạy. Đây là mục tiêu cốt lõi mà kỹ thuật giả lập sinh ra để bảo vệ, đồng thời là điều kiện để bộ kiểm thử có thể chạy trên máy chủ tích hợp liên tục.'
$h = @('Chỉ báo', 'Tiêu chí', 'Cách kiểm chứng')
$r = @(
    @('ĐL-1', 'Không nạp Spring context', 'Quét toàn bộ tệp kiểm thử ngoài thư mục demo để tìm các chú thích SpringBootTest, DataJpaTest, WebMvcTest và AutoConfigureMockMvc'),
    @('ĐL-2', 'Không kết nối cơ sở dữ liệu', 'Tìm chuỗi HikariPool và jdbc:mysql trong nhật ký chạy kiểm thử, thực hiện khi dịch vụ MySQL80 vẫn đang chạy'),
    @('ĐL-3', 'Không phụ thuộc dịch vụ bên ngoài', 'Kiểm tra các lớp gửi thư, gửi tin nhắn, bản đồ, thanh toán và mã xác thực đều được khai báo bằng đối tượng giả lập'),
    @('ĐL-4', 'Không chia sẻ trạng thái giữa các test case', 'Kiểm tra dữ liệu được dựng mới trong phương thức dựng của từng lớp và Mockito chạy ở chế độ kiểm tra chặt chẽ'),
    @('ĐL-5', 'Thứ tự chạy không ảnh hưởng kết quả', 'Chạy riêng một lớp, chạy riêng một phương thức và chạy lại toàn bộ với thứ tự ngẫu nhiên, so sánh kết quả'),
    @('ĐL-6', 'Kết quả xác định, không chập chờn', 'Chạy lại bộ kiểm thử nhiều lần trong cùng buổi đo và so sánh kết quả')
)
Add-Table $h $r @(1.6, 5.4, 9.5)

H '5.2. Kết quả kiểm chứng tính độc lập' 2
$h = @('Chỉ báo', 'Phép kiểm chứng đã thực hiện', 'Kết quả')
$r = @(
    @('ĐL-1', 'Quét toàn bộ tệp trong thư mục src/test ngoài thư mục demo tìm các chú thích SpringBootTest, DataJpaTest, WebMvcTest và AutoConfigureMockMvc', 'Không có kết quả nào. 11 trong 15 lớp kiểm thử đơn vị dùng chú thích ExtendWith với MockitoExtension; chỉ lớp đối chứng trong thư mục demo mới dùng SpringBootTest'),
    @('ĐL-2', 'Tìm chuỗi HikariPool và jdbc:mysql trong nhật ký của lần chạy 189 lượt và lần chạy 194 lượt', 'Không có kết quả nào, nghĩa là bộ kiểm thử không mở kết nối cơ sở dữ liệu dù dịch vụ MySQL80 đang chạy'),
    @('ĐL-3', 'Kiểm tra khai báo đối tượng giả lập của các lớp gửi thư, gửi tin nhắn, bản đồ, thanh toán và mã xác thực', 'Các lớp này đều được khai báo bằng Mock trong các lớp kiểm thử; nhật ký chạy chỉ có nội dung giả lập do mã nguồn in ra'),
    @('ĐL-4', 'Kiểm tra cấu trúc mã nguồn kiểm thử và lỗi khi chạy', '14 tệp có phương thức dựng dữ liệu bằng BeforeEach; mọi lần chạy đều không xuất hiện lỗi UnnecessaryStubbing do cơ chế kiểm tra chặt chẽ của Mockito'),
    @('ĐL-5a', 'Chạy riêng lớp kiểm thử xác thực bằng lệnh mvn với tham số lọc lớp và bỏ qua bước đo độ bao phủ', '26 trên 26 lượt đạt, BUILD SUCCESS, thời gian toàn lệnh 17,099 giây; nhật ký tại bang_chung_so_lieu/run_le_auth_189.log'),
    @('ĐL-5b', 'Chạy riêng một phương thức kiểm thử đăng ký thành công', '1 trên 1 lượt đạt, BUILD SUCCESS, thời gian toàn lệnh 14,302 giây; nhật ký tại bang_chung_so_lieu/run_le_1method_189.log'),
    @('ĐL-5c', 'Chạy lại toàn bộ 189 lượt với thứ tự phương thức ngẫu nhiên', '189 trên 189 lượt đạt, BUILD SUCCESS, thời gian toàn lệnh 20,554 giây; nhật ký tại bang_chung_so_lieu/run_thu_tu_ngau_nhien_189.log'),
    @('ĐL-6', 'Chạy lại bộ kiểm thử nhiều lần trong cùng buổi đo với các cấu hình khác nhau', 'Mọi lần đều đạt 189 trên 189 lượt và không có lượt nào chập chờn; kết quả độ bao phủ giữ nguyên giữa các lần chạy, ví dụ nhóm thanh toán luôn đạt 28 trên 28 dòng và nhóm xác thực luôn đạt 155 trên 155 dòng')
)
Add-Table $h $r @(1.6, 6.4, 8.5)

H '5.3. Đánh giá tiêu chí tính độc lập' 2
D 'Cả 6 chỉ báo từ ĐL-1 tới ĐL-6 đều đạt, trong đó chỉ báo ĐL-5 được kiểm chứng bằng ba lệnh chạy độc lập là chạy riêng một lớp, chạy riêng một phương thức và chạy lại toàn bộ với thứ tự ngẫu nhiên.'
D 'Kết quả này cho thấy bộ kiểm thử không phụ thuộc vào cơ sở dữ liệu, không phụ thuộc vào dịch vụ gửi thư hay cổng thanh toán và không phụ thuộc thứ tự chạy, vì vậy có thể chạy trên máy trạm hoặc trên máy chủ tích hợp liên tục mà không cần chuẩn bị hạ tầng.'
# ================= MUC 6: KET LUAN =================
H '6. Kết luận và hạn chế' 1
D 'Bộ kiểm thử đơn vị gồm 15 lớp với 182 phương thức, chạy thành 189 lượt, đã thiết kế và hiện thực đủ ba loại đường dẫn: 105 lượt đường dẫn thuận lợi chiếm 55,6 phần trăm, 21 lượt trường hợp biên chiếm 11,1 phần trăm và 63 lượt đường dẫn ngoại lệ chiếm 33,3 phần trăm.'
D 'Tiêu chí thời gian chạy đạt cả 4 ngưỡng đề ra: tổng thời gian tầng kiểm thử của 189 lượt là 4,721 giây, trung bình 25,0 mili giây mỗi lượt, lớp lâu nhất 0,901 giây và mọi lần chạy đều cho cùng kết quả. Đối chứng cho thấy cùng một luồng đăng nhập, cách có dùng kỹ thuật giả lập tốn 693,06 micro giây cho mỗi lần, còn cách dùng Spring context cùng cơ sở dữ liệu H2 tốn 270,60 mili giây cho mỗi lần và cần 39.654 mili giây chỉ để khởi động nền tảng.'
D 'Tiêu chí độ bao phủ đạt 4 trong 5 ngưỡng: đạt ở mức 100 phần trăm dòng ở 9 trong 12 lớp nghiệp vụ (cả 12 lớp đều đạt từ 93,3 phần trăm trở lên), 97,8 phần trăm dòng cho 12 lớp nghiệp vụ và 75,2 phần trăm dòng cho toàn dự án; ngưỡng không còn lớp nghiệp vụ ở mức 0 phần trăm đạt một phần vì không còn lớp 0 phần trăm nhưng hai lớp ghi nhật ký kiểm toán và mã xác thực vẫn còn độ bao phủ thấp. Ngưỡng chưa đạt là độ bao phủ nhánh từ 85 phần trăm trở lên cho từng lớp có nhánh.'
D 'Tiêu chí tính độc lập đạt cả 6 chỉ báo: không có lớp kiểm thử đơn vị nào nạp Spring context, không có kết nối cơ sở dữ liệu trong nhật ký chạy, không phụ thuộc dịch vụ bên ngoài, không chia sẻ trạng thái giữa các test case, kết quả không đổi khi chạy riêng lẻ hoặc chạy với thứ tự ngẫu nhiên và không có lượt kiểm thử chập chờn.'
D 'Hạn chế thứ nhất là bốn nhóm chức năng chưa đạt ngưỡng độ bao phủ nhánh gồm đơn hàng 46,9 phần trăm, xác thực 78,1 phần trăm, khách hàng 70,0 phần trăm và quản trị 83,3 phần trăm. Hướng khắc phục là bổ sung test case đi vào các nhánh chưa được thực thi, phần thiết kế bổ sung đã có trong tài liệu BAO_CAO_THIET_KE_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md tại mục 3.15.'
D 'Hạn chế thứ hai là hai lớp nghiệp vụ chưa có kiểm thử riêng gồm AuditLogServiceImpl và OTPServiceImpl còn ở mức bao phủ thấp, tương ứng 42 dòng mã chưa được kiểm chứng; ma trận kiểm thử bổ sung cho các lớp này đã được thiết kế sẵn trong mục 3.15 của tài liệu nêu trên.'
D 'Hạn chế thứ ba là đường dẫn biên chỉ chiếm 11,1 phần trăm và tập trung ở các lớp thuần logic; các nhóm quản lý đơn hàng, khách hàng và tài xế cần được bổ sung thêm test case biên để cân bằng ma trận kiểm thử.'
D 'Toàn bộ số liệu trong báo cáo này đều đọc từ các lần chạy thật, với nguồn dẫn chứng là các nhật ký trong thư mục bang_chung_so_lieu cùng tệp độ bao phủ jacoco_do_bao_phu_194.csv; báo cáo không sử dụng số liệu ước lượng hay số liệu tự đặt ra.'

# ================= LUU TEP =================
$doc.SaveAs2($outPath, 16)
$doc.Close(0)
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
Write-Output ('Da tao tep: ' + $outPath)
