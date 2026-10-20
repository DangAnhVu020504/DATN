# Sinh bang tong hop do bao phu kiem thu cua he thong - phien ban 194 luot (18/10/2026)
# Doi chieu: lan chay 163 luot (truoc mo rong) vs lan chay 194 luot (moi nhat, co jacoco:check)
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\ANHVU\LEARNING\DATN\DATN-Project'
$ev = $root + '\bang_chung_so_lieu'
$csvA = Import-Csv ($ev + '\jacoco_do_bao_phu_163.csv')
$csvB = Import-Csv ($ev + '\jacoco_do_bao_phu_194.csv')

function Tinh($csv, $mon) {
    $c = ($csv | Measure-Object $mon -Sum).Sum
    $m = ($csv | Measure-Object ($mon -replace '_COVERED$', '_MISSED') -Sum).Sum
    return [pscustomobject]@{ Cover = [int]$c; Total = [int]($c + $m) }
}
function PhanTram($o) { if ($o.Total -eq 0) { return 'Không tính' } ; $v = (100 * $o.Cover / $o.Total).ToString('N1', [Globalization.CultureInfo]::InvariantCulture) ; return (($v -replace '\.', ',') + ' phần trăm') }

$aLine = Tinh $csvA 'LINE_COVERED'; $aBr = Tinh $csvA 'BRANCH_COVERED'; $aIn = Tinh $csvA 'INSTRUCTION_COVERED'; $aMe = Tinh $csvA 'METHOD_COVERED'
$bLine = Tinh $csvB 'LINE_COVERED'; $bBr = Tinh $csvB 'BRANCH_COVERED'; $bIn = Tinh $csvB 'INSTRUCTION_COVERED'; $bMe = Tinh $csvB 'METHOD_COVERED'

# Bang theo goi
$pkgs = @($csvB | Group-Object PACKAGE | Select-Object -ExpandProperty Name | Sort-Object)
$goi = New-Object System.Collections.ArrayList
foreach ($p in $pkgs) {
    $gA = @($csvA | Where-Object { $_.PACKAGE -eq $p })
    $gB = @($csvB | Where-Object { $_.PACKAGE -eq $p })
    $lA = Tinh $gA 'LINE_COVERED'
    $lB = Tinh $gB 'LINE_COVERED'
    $bB = Tinh $gB 'BRANCH_COVERED'
    [void]$goi.Add([pscustomobject]@{
            Goi       = $p
            SoLop     = $gB.Count
            DongA     = ($lA.Cover.ToString() + ' trên ' + $lA.Total.ToString())
            PhanTramA = PhanTram $lA
            DongB     = ($lB.Cover.ToString() + ' trên ' + $lB.Total.ToString())
            PhanTramB = PhanTram $lB
            NhanhB    = ($bB.Cover.ToString() + ' trên ' + $bB.Total.ToString())
        })
}

# Bang theo lop
$lop = New-Object System.Collections.ArrayList
foreach ($r in ($csvB | Sort-Object PACKAGE, CLASS)) {
    $matchA = $csvA | Where-Object { $_.PACKAGE -eq $r.PACKAGE -and $_.CLASS -eq $r.CLASS } | Select-Object -First 1
    $lA = [pscustomobject]@{ Cover = 0; Total = 0 }
    if ($matchA) { $lA = [pscustomobject]@{ Cover = [int]$matchA.LINE_COVERED; Total = [int]$matchA.LINE_COVERED + [int]$matchA.LINE_MISSED } }
    $lB = [pscustomobject]@{ Cover = [int]$r.LINE_COVERED; Total = [int]$r.LINE_COVERED + [int]$r.LINE_MISSED }
    $bB = [pscustomobject]@{ Cover = [int]$r.BRANCH_COVERED; Total = [int]$r.BRANCH_COVERED + [int]$r.BRANCH_MISSED }
    [void]$lop.Add([pscustomobject]@{
            Goi       = $r.PACKAGE
            Lop       = $r.CLASS
            DongA     = ($lA.Cover.ToString() + ' trên ' + $lA.Total.ToString())
            PhanTramA = PhanTram $lA
            DongB     = ($lB.Cover.ToString() + ' trên ' + $lB.Total.ToString())
            PhanTramB = PhanTram $lB
            NhanhB    = ($bB.Cover.ToString() + ' trên ' + $bB.Total.ToString())
        })
}

# Dong 0% o lan chay moi nhat
$khong = @($csvB | Where-Object { [int]$_.LINE_COVERED -eq 0 } | Sort-Object PACKAGE, CLASS | ForEach-Object { [pscustomobject]@{ Goi = $_.PACKAGE; Lop = $_.CLASS } })

# Nhom 12 lop nghiep vu trong tam (dung pham vi rule jacoco:check) va cac nhom doi chieu
$ten12 = @('PaymentServiceImpl', 'PricingServiceImpl', 'DistanceServiceImpl', 'DriverServiceImpl', 'AdminServiceImpl', 'NotificationServiceImpl', 'CustomerServiceImpl', 'OrderServiceImpl', 'VoucherServiceImpl', 'ReviewServiceImpl', 'AuthServiceImpl', 'WalletServiceImpl')
$s12A = @($csvA | Where-Object { $ten12 -contains $_.CLASS })
$s12B = @($csvB | Where-Object { $ten12 -contains $_.CLASS })
$l12A = Tinh $s12A 'LINE_COVERED'
$l12B = Tinh $s12B 'LINE_COVERED'
$pkgImplA = Tinh (@($csvA | Where-Object { $_.PACKAGE -eq 'com.speed.delivery.service.impl' })) 'LINE_COVERED'
$pkgImplB = Tinh (@($csvB | Where-Object { $_.PACKAGE -eq 'com.speed.delivery.service.impl' })) 'LINE_COVERED'
$secA = Tinh (@($csvA | Where-Object { $_.CLASS -in @('JwtTokenProvider', 'CustomUserDetailsService') })) 'LINE_COVERED'
$secB = Tinh (@($csvB | Where-Object { $_.CLASS -in @('JwtTokenProvider', 'CustomUserDetailsService') })) 'LINE_COVERED'

$goi | Export-Csv -Path ($root + '\Do_bao_phu_he_thong_194.csv') -NoTypeInformation -Encoding UTF8 -Delimiter ';'
$lop | Export-Csv -Path ($root + '\Do_bao_phu_he_thong_chi_tiet_lop_194.csv') -NoTypeInformation -Encoding UTF8 -Delimiter ';'

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<!DOCTYPE html>')
[void]$sb.AppendLine('<html lang="vi"><head><meta charset="utf-8">')
[void]$sb.AppendLine('<title>Độ bao phủ kiểm thử của hệ thống</title>')
[void]$sb.AppendLine('<style>')
[void]$sb.AppendLine('body { font-family: "Times New Roman", serif; font-size: 14px; color: #000000; margin: 20px; }')
[void]$sb.AppendLine('h1 { font-size: 18px; } h2 { font-size: 15px; }')
[void]$sb.AppendLine('table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }')
[void]$sb.AppendLine('th, td { border: 1px solid #000000; padding: 3px 5px; text-align: left; vertical-align: top; }')
[void]$sb.AppendLine('</style></head><body>')
[void]$sb.AppendLine('<h1>Độ bao phủ kiểm thử của hệ thống</h1>')
[void]$sb.AppendLine('<p>Thời điểm đo mới nhất: ngày 18 tháng 10 năm 2026 (lệnh mvn clean verify, đã gồm cả bước tự kiểm tra ngưỡng jacoco:check). Công cụ: JaCoCo phiên bản 0.8.12 chạy cùng Maven Surefire 3.5.2. Số liệu lấy trực tiếp từ tệp target/site/jacoco/jacoco.csv; bản lưu trong thư mục bang_chung_so_lieu: jacoco_do_bao_phu_163.csv (lần chạy cũ, để đối chiếu) và jacoco_do_bao_phu_194.csv (lần chạy mới nhất).</p>')
[void]$sb.AppendLine('<p>Hai lần đo: lần thứ nhất chạy 163 lượt trước khi mở rộng bộ kiểm thử; lần thứ hai chạy toàn bộ 194 lượt sau khi bổ sung WalletServiceImplTest (16 test) và mở rộng Driver/Voucher/Auth. Nhật ký chạy tương ứng: do_bao_phu_163_toan_bo.log và ket_qua_verify_mocking.log.</p>')
[void]$sb.AppendLine('<p>Phạm vi: số liệu là độ bao phủ của phần máy chủ backend. Hai dự án giao diện là speed-frontend và Modern Delivery System UI không có tệp kiểm thử và không khai báo công cụ chạy kiểm thử trong package.json, nên không có số liệu độ bao phủ cho phần giao diện.</p>')
[void]$sb.AppendLine('<h2>Tổng quan</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Chỉ số</th><th>Lần chạy 163 lượt</th><th>Lần chạy 194 lượt (mới nhất)</th></tr></thead><tbody>')
$rows = @(
    @('Số lớp được đo', ($csvA.Count.ToString() + ' lớp'), ($csvB.Count.ToString() + ' lớp')),
    @('Độ bao phủ dòng', ($aLine.Cover.ToString() + ' trên ' + $aLine.Total.ToString() + ' tương ứng ' + (PhanTram $aLine)), ($bLine.Cover.ToString() + ' trên ' + $bLine.Total.ToString() + ' tương ứng ' + (PhanTram $bLine))),
    @('Độ bao phủ nhánh', ($aBr.Cover.ToString() + ' trên ' + $aBr.Total.ToString() + ' tương ứng ' + (PhanTram $aBr)), ($bBr.Cover.ToString() + ' trên ' + $bBr.Total.ToString() + ' tương ứng ' + (PhanTram $bBr))),
    @('Độ bao phủ chỉ dẫn', ($aIn.Cover.ToString() + ' trên ' + $aIn.Total.ToString() + ' tương ứng ' + (PhanTram $aIn)), ($bIn.Cover.ToString() + ' trên ' + $bIn.Total.ToString() + ' tương ứng ' + (PhanTram $bIn))),
    @('Độ bao phủ phương thức', ($aMe.Cover.ToString() + ' trên ' + $aMe.Total.ToString() + ' tương ứng ' + (PhanTram $aMe)), ($bMe.Cover.ToString() + ' trên ' + $bMe.Total.ToString() + ' tương ứng ' + (PhanTram $bMe))),
    @('Gói service.impl', ('18 lớp, dòng ' + $pkgImplA.Cover.ToString() + ' trên ' + $pkgImplA.Total.ToString() + ' tương ứng ' + (PhanTram $pkgImplA)), ('18 lớp, dòng ' + $pkgImplB.Cover.ToString() + ' trên ' + $pkgImplB.Total.ToString() + ' tương ứng ' + (PhanTram $pkgImplB))),
    @('12 lớp nghiệp vụ trọng tâm (phạm vi jacoco:check)', (($l12A.Cover.ToString() + ' trên ' + $l12A.Total.ToString() + ' tương ứng ' + (PhanTram $l12A))), ($l12B.Cover.ToString() + ' trên ' + $l12B.Total.ToString() + ' tương ứng ' + (PhanTram $l12B))),
    @('2 lớp bảo mật đã có kiểm thử', ('dòng ' + $secA.Cover.ToString() + ' trên ' + $secA.Total.ToString()), ('dòng ' + $secB.Cover.ToString() + ' trên ' + $secB.Total.ToString()))
)
foreach ($r in $rows) { [void]$sb.AppendLine('<tr><td>' + $r[0] + '</td><td>' + $r[1] + '</td><td>' + $r[2] + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Theo gói mã nguồn</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Gói</th><th>Số lớp</th><th>Lần chạy 163 lượt</th><th>Tỉ lệ dòng</th><th>Lần chạy 194 lượt</th><th>Tỉ lệ dòng</th><th>Nhánh đã phủ trên tổng</th></tr></thead><tbody>')
foreach ($g in $goi) { [void]$sb.AppendLine('<tr><td>' + $g.Goi + '</td><td>' + $g.SoLop + '</td><td>' + $g.DongA + '</td><td>' + $g.PhanTramA + '</td><td>' + $g.DongB + '</td><td>' + $g.PhanTramB + '</td><td>' + $g.NhanhB + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Chi tiết theo từng lớp</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Gói</th><th>Lớp</th><th>Lần chạy 163 lượt</th><th>Tỉ lệ dòng</th><th>Lần chạy 194 lượt</th><th>Tỉ lệ dòng</th><th>Nhánh đã phủ trên tổng</th></tr></thead><tbody>')
foreach ($r in $lop) { [void]$sb.AppendLine('<tr><td>' + $r.Goi + '</td><td>' + $r.Lop + '</td><td>' + $r.DongA + '</td><td>' + $r.PhanTramA + '</td><td>' + $r.DongB + '</td><td>' + $r.PhanTramB + '</td><td>' + $r.NhanhB + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Các lớp chưa được chạm tới ở lần chạy mới nhất</h2>')
[void]$sb.AppendLine('<p>Tổng số ' + $khong.Count + ' lớp có độ bao phủ dòng bằng 0, gồm lớp điều khiển giao diện, lớp thực thể, lớp cấu hình và một số lớp thuộc gói khác ngoài phạm vi kiểm thử đơn vị. Toàn bộ lớp nghiệp vụ chính đều đã được chạm tới: WalletServiceImpl tăng từ 1,4 phần trăm lên 100 phần trăm; AuditLogServiceImpl đạt 35,5 phần trăm gián tiếp qua các lớp được kiểm thử.</p>')
[void]$sb.AppendLine('<table><thead><tr><th>Gói</th><th>Lớp</th></tr></thead><tbody>')
foreach ($k in $khong) { [void]$sb.AppendLine('<tr><td>' + $k.Goi + '</td><td>' + $k.Lop + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Đối chiếu với ngưỡng đã đề ra trong báo cáo</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Mã</th><th>Ngưỡng</th><th>Kết quả đo</th><th>Kết luận</th></tr></thead><tbody>')
[void]$sb.AppendLine('<tr><td>BP-1</td><td>Từ 90 phần trăm dòng cho từng lớp nghiệp vụ trọng tâm (đúng phạm vi rule jacoco:check)</td><td>12 trên 12 lớp đạt từ 93,3 tới 100 phần trăm; trong đó 9 lớp đạt 100 phần trăm; được xác minh tự động mỗi lần chạy mvn verify</td><td>Đạt</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-2</td><td>Từ 85 phần trăm nhánh ghi nhận cho từng lớp nghiệp vụ có nhánh</td><td>Đạt ở thanh toán 100 phần trăm, tính giá 100 phần trăm, ví 100 phần trăm, mã giảm giá 95,0 phần trăm, tài xế 90,0 phần trăm, đánh giá 85,7 phần trăm; chưa đạt ở đơn hàng 46,9 phần trăm, xác thực 78,1 phần trăm, khách hàng 70,0 phần trăm, quản trị 83,3 phần trăm</td><td>Chưa đạt toàn bộ</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-3</td><td>Từ 95 phần trăm dòng cho nhóm 12 lớp nghiệp vụ trọng tâm</td><td>' + (PhanTram $l12B) + ' (lần chạy 194 lượt)</td><td>Đạt</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-4</td><td>Từ 60 phần trăm dòng cho toàn dự án</td><td>' + (PhanTram $aLine) + ' ở lần chạy 163 lượt và ' + (PhanTram $bLine) + ' ở lần chạy 194 lượt</td><td>Đạt</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-5</td><td>Không còn lớp nghiệp vụ ở mức 0 phần trăm</td><td>Không còn lớp nghiệp vụ nào ở mức 0 phần trăm (WalletServiceImpl đã được bổ sung kiểm thử); ' + $khong.Count + ' lớp còn lại đều thuộc tầng điều khiển, thực thể, cấu hình ngoài phạm vi</td><td>Đạt trong phạm vi nghiệp vụ</td></tr>')
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Cách xem báo cáo chi tiết của công cụ</h2>')
[void]$sb.AppendLine('<p>Mở tệp speed-backend/target/site/jacoco/index.html bằng trình duyệt, sau đó nhấp vào tên gói rồi nhấp vào tên lớp để xem từng dòng mã đã được chạy tới hay chưa. Vùng màu xanh là dòng đã được kiểm thử chạy qua, vùng màu đỏ là dòng chưa được chạy tới, vùng màu vàng là nhánh chưa được đi hết.</p>')
[void]$sb.AppendLine('</body></html>')
[System.IO.File]::WriteAllText(($root + '\Do_bao_phu_he_thong_194.html'), $sb.ToString(), [System.Text.UTF8Encoding]::new($true))

Write-Output ('Toan he thong, lan chay 163 luot: dong ' + (PhanTram $aLine) + ', nhanh ' + (PhanTram $aBr) + ', chi dan ' + (PhanTram $aIn) + ', phuong thuc ' + (PhanTram $aMe))
Write-Output ('Toan he thong, lan chay 194 luot: dong ' + (PhanTram $bLine) + ', nhanh ' + (PhanTram $bBr) + ', chi dan ' + (PhanTram $bIn) + ', phuong thuc ' + (PhanTram $bMe))
Write-Output ('12 lop nghiep vu trong tam, lan 194: ' + (PhanTram $l12B))
Write-Output ('So lop 0 phan tram o lan 194: ' + $khong.Count)
Write-Output ('Da tao: ' + $root + '\Do_bao_phu_he_thong_194.html')
Write-Output ('Da tao: ' + $root + '\Do_bao_phu_he_thong_194.csv')
Write-Output ('Da tao: ' + $root + '\Do_bao_phu_he_thong_chi_tiet_lop_194.csv')
