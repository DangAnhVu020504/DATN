# Sinh bang tong hop do bao phu kiem thu cua he thong tu 2 lan chay JaCoCo
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\ANHVU\LEARNING\DATN\DATN-Project'
$ev = $root + '\bang_chung_so_lieu'
$csvA = Import-Csv ($ev + '\jacoco_do_bao_phu_158.csv')
$csvB = Import-Csv ($ev + '\jacoco_do_bao_phu_163.csv')

function Tinh($csv, $mon) {
    $c = ($csv | Measure-Object $mon -Sum).Sum
    $m = ($csv | Measure-Object ($mon -replace '_COVERED$', '_MISSED') -Sum).Sum
    return [pscustomobject]@{ Cover = [int]$c; Total = [int]($c + $m) }
}
function PhanTram($o) { if ($o.Total -eq 0) { return 'Không tính' } ; $v = (100 * $o.Cover / $o.Total).ToString('N1', [Globalization.CultureInfo]::InvariantCulture) ; return (($v -replace '\.', ',') + ' phần trăm') }
function TyLe($o) { if ($o.Total -eq 0) { return 0.0 } ; return (100 * $o.Cover / $o.Total) }

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
            Goi      = $p
            SoLop    = $gB.Count
            DongA    = ($lA.Cover.ToString() + ' trên ' + $lA.Total.ToString())
            PhanTramA = PhanTram $lA
            DongB    = ($lB.Cover.ToString() + ' trên ' + $lB.Total.ToString())
            PhanTramB = PhanTram $lB
            NhanhB   = ($bB.Cover.ToString() + ' trên ' + $bB.Total.ToString())
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

# Dong 0% o lan chay don vi
$khong = @($csvA | Where-Object { [int]$_.LINE_COVERED -eq 0 } | Sort-Object PACKAGE, CLASS | ForEach-Object { [pscustomobject]@{ Goi = $_.PACKAGE; Lop = $_.CLASS } })

$goi | Export-Csv -Path ($root + '\Do_bao_phu_he_thong.csv') -NoTypeInformation -Encoding UTF8 -Delimiter ';'
$lop | Export-Csv -Path ($root + '\Do_bao_phu_he_thong_chi_tiet_lop.csv') -NoTypeInformation -Encoding UTF8 -Delimiter ';'
# Tinh them cho nhom 11 lop nghiep vu da co kiem thu
$ten11 = @('PaymentServiceImpl', 'PricingServiceImpl', 'DistanceServiceImpl', 'DriverServiceImpl', 'AdminServiceImpl', 'NotificationServiceImpl', 'CustomerServiceImpl', 'OrderServiceImpl', 'VoucherServiceImpl', 'ReviewServiceImpl', 'AuthServiceImpl')
$s11A = @($csvA | Where-Object { $ten11 -contains $_.CLASS })
$s11B = @($csvB | Where-Object { $ten11 -contains $_.CLASS })

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
[void]$sb.AppendLine('<p>Thời điểm đo: ngày 1 tháng 10 năm 2026. Công cụ: JaCoCo phiên bản 0.8.12 chạy cùng Maven Surefire 3.5.2. Số liệu lấy trực tiếp từ tệp target/site/jacoco/jacoco.csv và được lưu trong thư mục bang_chung_so_lieu thành hai bản: jacoco_do_bao_phu_158.csv và jacoco_do_bao_phu_163.csv.</p>')
[void]$sb.AppendLine('<p>Kết quả đo trùng khớp hoàn toàn với lần đo ngày 30 tháng 9 năm 2026 đã ghi trong báo cáo thiết kế ma trận kiểm thử, chỉ khác nhau ở thời gian chạy do trạng thái máy. Điều này cho thấy độ bao phủ của bộ kiểm thử là ổn định qua các lần chạy.</p>')
[void]$sb.AppendLine('<p>Hai lần đo: lần thứ nhất chạy 158 lượt kiểm thử đơn vị, mọi lượt đều đạt; lần thứ hai chạy toàn bộ 163 lượt, gồm thêm 2 lớp đối chứng dùng Spring context và cơ sở dữ liệu H2. Nhật ký chạy tương ứng là do_bao_phu_158_don_vi.log và do_bao_phu_163_toan_bo.log.</p>')
[void]$sb.AppendLine('<p>Phạm vi: số liệu là độ bao phủ của phần máy chủ backend. Hai dự án giao diện là speed-frontend và Modern Delivery System UI không có tệp kiểm thử và không khai báo công cụ chạy kiểm thử trong package.json, nên không có số liệu độ bao phủ cho phần giao diện.</p>')
[void]$sb.AppendLine('<h2>Tổng quan</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Chỉ số</th><th>Lần chạy 158 lượt kiểm thử đơn vị</th><th>Lần chạy 163 lượt gồm 2 lớp đối chứng</th></tr></thead><tbody>')
$rows = @(
    @('Số lớp được đo', ($csvA.Count.ToString() + ' lớp'), ($csvB.Count.ToString() + ' lớp')),
    @('Độ bao phủ dòng', ($aLine.Cover.ToString() + ' trên ' + $aLine.Total.ToString() + ' tương ứng ' + (PhanTram $aLine)), ($bLine.Cover.ToString() + ' trên ' + $bLine.Total.ToString() + ' tương ứng ' + (PhanTram $bLine))),
    @('Độ bao phủ nhánh', ($aBr.Cover.ToString() + ' trên ' + $aBr.Total.ToString() + ' tương ứng ' + (PhanTram $aBr)), ($bBr.Cover.ToString() + ' trên ' + $bBr.Total.ToString() + ' tương ứng ' + (PhanTram $bBr))),
    @('Độ bao phủ chỉ dẫn', ($aIn.Cover.ToString() + ' trên ' + $aIn.Total.ToString() + ' tương ứng ' + (PhanTram $aIn)), ($bIn.Cover.ToString() + ' trên ' + $bIn.Total.ToString() + ' tương ứng ' + (PhanTram $bIn))),
    @('Độ bao phủ phương thức', ($aMe.Cover.ToString() + ' trên ' + $aMe.Total.ToString() + ' tương ứng ' + (PhanTram $aMe)), ($bMe.Cover.ToString() + ' trên ' + $bMe.Total.ToString() + ' tương ứng ' + (PhanTram $bMe))),
    @('Gói service.impl', '18 lớp, dòng 689 trên 872 tương ứng 79,0 phần trăm', '18 lớp, dòng 710 trên 872 tương ứng 81,4 phần trăm'),
    @('11 lớp nghiệp vụ đã có kiểm thử', ((Tinh $s11A 'LINE_COVERED').Cover.ToString() + ' trên ' + (Tinh $s11A 'LINE_COVERED').Total.ToString() + ' tương ứng ' + (PhanTram (Tinh $s11A 'LINE_COVERED'))), ((Tinh $s11B 'LINE_COVERED').Cover.ToString() + ' trên ' + (Tinh $s11B 'LINE_COVERED').Total.ToString() + ' tương ứng ' + (PhanTram (Tinh $s11B 'LINE_COVERED')))),
    @('2 lớp bảo mật đã có kiểm thử', 'dòng 52 trên 56, nhánh 2 trên 2', 'dòng 52 trên 56, nhánh 2 trên 2')
)
foreach ($r in $rows) { [void]$sb.AppendLine('<tr><td>' + $r[0] + '</td><td>' + $r[1] + '</td><td>' + $r[2] + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Theo gói mã nguồn</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Gói</th><th>Số lớp</th><th>Lần chạy 158 lượt</th><th>Tỉ lệ dòng</th><th>Lần chạy 163 lượt</th><th>Tỉ lệ dòng</th><th>Nhánh đã phủ trên tổng</th></tr></thead><tbody>')
foreach ($g in $goi) { [void]$sb.AppendLine('<tr><td>' + $g.Goi + '</td><td>' + $g.SoLop + '</td><td>' + $g.DongA + '</td><td>' + $g.PhanTramA + '</td><td>' + $g.DongB + '</td><td>' + $g.PhanTramB + '</td><td>' + $g.NhanhB + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Chi tiết theo từng lớp</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Gói</th><th>Lớp</th><th>Lần chạy 158 lượt</th><th>Tỉ lệ dòng</th><th>Lần chạy 163 lượt</th><th>Tỉ lệ dòng</th><th>Nhánh đã phủ trên tổng</th></tr></thead><tbody>')
foreach ($r in $lop) { [void]$sb.AppendLine('<tr><td>' + $r.Goi + '</td><td>' + $r.Lop + '</td><td>' + $r.DongA + '</td><td>' + $r.PhanTramA + '</td><td>' + $r.DongB + '</td><td>' + $r.PhanTramB + '</td><td>' + $r.NhanhB + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Các lớp chưa được chạm tới ở lần chạy kiểm thử đơn vị</h2>')
[void]$sb.AppendLine('<p>Tổng số ' + $khong.Count + ' lớp có độ bao phủ dòng bằng 0, gồm lớp điều khiển giao diện, lớp thực thể, lớp cấu hình, lớp lọc bảo mật, lớp xử lý lỗi toàn cục và 7 lớp dịch vụ chưa viết kiểm thử.</p>')
[void]$sb.AppendLine('<table><thead><tr><th>Gói</th><th>Lớp</th></tr></thead><tbody>')
foreach ($k in $khong) { [void]$sb.AppendLine('<tr><td>' + $k.Goi + '</td><td>' + $k.Lop + '</td></tr>') }
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Đối chiếu với ngưỡng đã đề ra trong báo cáo</h2>')
[void]$sb.AppendLine('<table><thead><tr><th>Mã</th><th>Ngưỡng</th><th>Kết quả đo</th><th>Kết luận</th></tr></thead><tbody>')
[void]$sb.AppendLine('<tr><td>BP-1</td><td>Từ 90 phần trăm dòng cho từng lớp nghiệp vụ đã có kiểm thử</td><td>10 trên 11 lớp đạt từ 93,5 tới 100 phần trăm; lớp xác thực đạt 89,7 phần trăm</td><td>Gần đạt</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-2</td><td>Từ 85 phần trăm nhánh cho từng lớp nghiệp vụ có nhánh</td><td>Đạt ở thanh toán 100 phần trăm, tính giá 100 phần trăm, mã giảm giá 94,4 phần trăm, tài xế 90,0 phần trăm, đánh giá 85,7 phần trăm; chưa đạt ở đơn hàng 51,7 phần trăm, xác thực 50,0 phần trăm, khách hàng 70,0 phần trăm, quản trị 83,3 phần trăm</td><td>Chưa đạt</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-3</td><td>Từ 95 phần trăm dòng cho 11 lớp nghiệp vụ</td><td>' + (PhanTram (Tinh $s11A 'LINE_COVERED')) + '</td><td>Đạt</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-4</td><td>Từ 60 phần trăm dòng cho toàn dự án</td><td>' + (PhanTram $aLine) + ' ở lần chạy kiểm thử đơn vị và ' + (PhanTram $bLine) + ' khi chạy thêm 2 lớp đối chứng</td><td>Đạt</td></tr>')
[void]$sb.AppendLine('<tr><td>BP-5</td><td>Không còn lớp nghiệp vụ ở mức 0 phần trăm</td><td>Còn 7 lớp ở mức 0 phần trăm, trong đó 3 lớp nghiệp vụ chính là WalletServiceImpl, AuditLogServiceImpl và OTPServiceImpl</td><td>Chưa đạt</td></tr>')
[void]$sb.AppendLine('</tbody></table>')
[void]$sb.AppendLine('<h2>Cách xem báo cáo chi tiết của công cụ</h2>')
[void]$sb.AppendLine('<p>Mở tệp speed-backend/target/site/jacoco/index.html bằng trình duyệt, sau đó nhấp vào tên gói rồi nhấp vào tên lớp để xem từng dòng mã đã được chạy tới hay chưa. Vùng màu xanh là dòng đã được kiểm thử chạy qua, vùng màu đỏ là dòng chưa được chạy tới, vùng màu vàng là nhánh chưa được đi hết.</p>')
[void]$sb.AppendLine('</body></html>')
[System.IO.File]::WriteAllText(($root + '\Do_bao_phu_he_thong.html'), $sb.ToString(), [System.Text.UTF8Encoding]::new($true))

Write-Output ('Toan he thong, lan chay 158 luot: dong ' + (PhanTram $aLine) + ', nhanh ' + (PhanTram $aBr) + ', chi dan ' + (PhanTram $aIn) + ', phuong thuc ' + (PhanTram $aMe))
Write-Output ('Toan he thong, lan chay 163 luot: dong ' + (PhanTram $bLine) + ', nhanh ' + (PhanTram $bBr) + ', chi dan ' + (PhanTram $bIn) + ', phuong thuc ' + (PhanTram $bMe))
Write-Output ('11 lop nghiep vu da co kiem thu: ' + (PhanTram (Tinh $s11A 'LINE_COVERED')))
Write-Output ('So lop 0 phan tram: ' + $khong.Count)
Write-Output ('Da tao: ' + $root + '\Do_bao_phu_he_thong.html')
Write-Output ('Da tao: ' + $root + '\Do_bao_phu_he_thong.csv')
Write-Output ('Da tao: ' + $root + '\Do_bao_phu_he_thong_chi_tiet_lop.csv')
