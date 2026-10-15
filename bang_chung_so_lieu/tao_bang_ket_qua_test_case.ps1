# Sinh bang doi chieu ket qua test case tu bao cao Surefire + ma nguon kiem thu
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\ANHVU\LEARNING\DATN\DATN-Project'
$srcRoot = $root + '\speed-backend\src\test\java'
$repDir = $root + '\speed-backend\target\surefire-reports'

# 1. Doc ma nguon kiem thu: lop ngoai, lop long, ten phuong thuc, ten hien thi
$meta = @{}
$metaOrder = New-Object System.Collections.ArrayList
foreach ($f in (Get-ChildItem $srcRoot -Recurse -Filter *.java)) {
    $lines = Get-Content $f.FullName -Encoding UTF8
    $outer = ''
    $current = ''
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $mClass = [regex]::Match($line, '\bclass\s+(\w+)')
        if ($mClass.Success) {
            if ($outer -eq '') { $outer = $mClass.Groups[1].Value } else { $current = $mClass.Groups[1].Value }
            continue
        }
        $mMethod = [regex]::Match($line, '(?:public|private|protected)?\s*(?:static\s+)?void\s+(\w+)\s*\(')
        if ($mMethod.Success) {
            $mName = $mMethod.Groups[1].Value
            $dn = ''
            $isTest = $false
            $isFixture = $false
            for ($j = $i; $j -ge [Math]::Max(0, $i - 12); $j--) {
                $seg = $lines[$j]
                if ($seg -match '@DisplayName\("([^"]*)"\)' -and $dn -eq '') { $dn = $Matches[1] }
                if ($seg -match '@Test\b|@ParameterizedTest|@RepeatedTest') { $isTest = $true }
                if ($seg -match '@BeforeEach|@AfterEach|@BeforeAll|@AfterAll') { $isFixture = $true }
                if ($j -lt $i -and $seg -match '\bvoid\s+\w+\s*\(') { break }
            }
            $key = $outer + '|' + $mName
            if ($isTest -and -not $isFixture -and -not $meta.ContainsKey($key) -and $outer -ne '') {
                $nhom = 'Bộ kiểm thử đơn vị'
                if ($outer -eq 'MockingDemoTest' -or $outer -eq 'SpringContextDemoTest') { $nhom = 'Lớp đối chứng' }
                $meta[$key] = [pscustomobject]@{ Outer = $outer; Nested = $current; Method = $mName; Display = $dn; File = $f.Name; Nhom = $nhom }
                [void]$metaOrder.Add($key)
            }
        }
    }
}

# 2. Doc bao cao Surefire: tung test case va tung luot chay
$agg = @{}
foreach ($x in (Get-ChildItem $repDir -Filter 'TEST-*.xml')) {
    $raw = Get-Content $x.FullName -Raw -Encoding UTF8
    $suite = [regex]::Match($raw, 'testsuite\s+name="([^"]+)"').Groups[1].Value
    if ($suite -eq '') { $suite = [regex]::Match($raw, 'name="([^"]+)"').Groups[1].Value }
    $tail = $suite.Split('.')[-1]
    $outer = $tail.Split('$')[0]
    foreach ($m in [regex]::Matches($raw, '<testcase\b[^>]*?(?:/>|>.*?</testcase>)', 'Singleline')) {
        $seg = $m.Value
        $nm = [regex]::Match($seg, 'name="([^"]*)"').Groups[1].Value
        $tm = [double]::Parse([regex]::Match($seg, 'time="([0-9.]+)"').Groups[1].Value, [Globalization.CultureInfo]::InvariantCulture)
        $base = [regex]::Replace($nm, '\(.*', '')
        $st = 'Đạt'
        if ($seg -match '<failure') { $st = 'Không đạt' }
        elseif ($seg -match '<error') { $st = 'Lỗi' }
        elseif ($seg -match '<skipped') { $st = 'Bỏ qua' }
        $key = $outer + '|' + $base
        if (-not $agg.ContainsKey($key)) {
            $agg[$key] = [pscustomobject]@{ Luot = 0; Time = 0.0; Status = 'Đạt' }
        }
        $agg[$key].Luot = $agg[$key].Luot + 1
        $agg[$key].Time = $agg[$key].Time + $tm
        if ($st -ne 'Đạt') { $agg[$key].Status = $st }
    }
}

# 3. Ghep hai nguon du lieu thanh bang ket qua
$rows = New-Object System.Collections.ArrayList
$fail = 0
foreach ($key in $metaOrder) {
    $info = $meta[$key]
    $luot = 0
    $time = 0.0
    $status = 'Không có trong báo cáo Surefire'
    if ($agg.ContainsKey($key)) {
        $luot = $agg[$key].Luot
        $time = $agg[$key].Time
        $status = $agg[$key].Status
    }
    if ($status -ne 'Đạt') { $fail = $fail + 1 }
    $nested = $info.Nested
    if ($nested -eq '') { $nested = 'không' }
    [void]$rows.Add([pscustomobject]@{
            Nhom       = $info.Nhom
            LopKiemThu = $info.Outer
            NhomCon    = $nested
            TenHienThi = $info.Display
            PhuongThuc = $info.Method
            SoLuot     = $luot
            TimeNum    = $time
            ThoiGian   = ('{0:N3}' -f $time)
            KetQua     = $status
        })
}
$mainRows = @($rows | Where-Object { $_.Nhom -eq 'Bộ kiểm thử đơn vị' })
$demoRows = @($rows | Where-Object { $_.Nhom -eq 'Lớp đối chứng' })
foreach ($g in @($mainRows, $demoRows)) {
    if ($g.Count -gt 0) {
        $gLuot = ($g | Measure-Object -Property SoLuot -Sum).Sum
        $gTime = ($g | Measure-Object -Property TimeNum -Sum).Sum
        $gFail = @($g | Where-Object { $_.KetQua -ne 'Đạt' }).Count
        Write-Output ($g[0].Nhom + ': so phuong thuc=' + $g.Count + ', so luot=' + $gLuot + ', so phuong thuc khong dat=' + $gFail + ', tong thoi gian=' + ('{0:N3}' -f $gTime) + ' giay')
    }
}
# 4. Xuat tep CSV (mo bang Excel)
$csvPath = $root + '\Ket_qua_test_case.csv'
@($mainRows + $demoRows) | Select-Object Nhom, LopKiemThu, NhomCon, TenHienThi, PhuongThuc, SoLuot, ThoiGian, KetQua | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8 -Delimiter ';'

# 5. Xuat trang HTML de xem tren trinh duyet
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<!DOCTYPE html>')
[void]$sb.AppendLine('<html lang="vi"><head><meta charset="utf-8">')
[void]$sb.AppendLine('<title>Kết quả test case - dự án Speed Delivery</title>')
[void]$sb.AppendLine('<style>')
[void]$sb.AppendLine('body { font-family: "Times New Roman", serif; font-size: 14px; color: #000000; margin: 20px; }')
[void]$sb.AppendLine('h1 { font-size: 18px; }')
[void]$sb.AppendLine('table { border-collapse: collapse; width: 100%; }')
[void]$sb.AppendLine('th, td { border: 1px solid #000000; padding: 4px 6px; vertical-align: top; text-align: left; }')
[void]$sb.AppendLine('input { font-family: inherit; font-size: 14px; padding: 4px; width: 340px; margin-bottom: 8px; }')
[void]$sb.AppendLine('</style></head><body>')
[void]$sb.AppendLine('<h1>Kết quả thực thi của từng test case</h1>')
[void]$sb.AppendLine('<p>Nguồn số liệu: báo cáo Maven Surefire trong thư mục speed-backend/target/surefire-reports ghép với tên hiển thị trong mã nguồn kiểm thử. Số liệu của lần chạy 158 lượt ngày 1 tháng 10 năm 2026; riêng 2 lớp đối chứng lấy từ lần chạy toàn bộ 163 lượt cùng ngày.</p>')
$mainLuot = ($mainRows | Measure-Object -Property SoLuot -Sum).Sum
$mainTime = ($mainRows | Measure-Object -Property TimeNum -Sum).Sum
$mainFail = @($mainRows | Where-Object { $_.KetQua -ne 'Đạt' }).Count
$demoLuot = ($demoRows | Measure-Object -Property SoLuot -Sum).Sum
$demoTime = ($demoRows | Measure-Object -Property TimeNum -Sum).Sum
$demoFail = @($demoRows | Where-Object { $_.KetQua -ne 'Đạt' }).Count
[void]$sb.AppendLine('<p>Bộ kiểm thử đơn vị: ' + $mainRows.Count + ' phương thức, ' + $mainLuot + ' lượt chạy, ' + $mainFail + ' phương thức không đạt, tổng thời gian ' + ('{0:N3}' -f $mainTime) + ' giây.</p>')
[void]$sb.AppendLine('<p>Hai lớp đối chứng: ' + $demoRows.Count + ' phương thức, ' + $demoLuot + ' lượt chạy, ' + $demoFail + ' phương thức không đạt, tổng thời gian ' + ('{0:N3}' -f $demoTime) + ' giây.</p>')
[void]$sb.AppendLine('<p><input id="q" type="text" placeholder="Gõ để lọc theo lớp, mã test case hoặc tên phương thức" onkeyup="loc()"></p>')
function Hien-Bang($nhanTieuDe, $ghiChu, $list) {
    [void]$sb.AppendLine('<h2>' + $nhanTieuDe + '</h2>')
    if ($ghiChu -ne '') { [void]$sb.AppendLine('<p>' + $ghiChu + '</p>') }
    [void]$sb.AppendLine('<table><thead><tr><th>Lớp kiểm thử</th><th>Nhóm con</th><th>Mã hoặc tên hiển thị</th><th>Phương thức kiểm thử</th><th>Số lượt</th><th>Thời gian (giây)</th><th>Kết quả</th></tr></thead><tbody>')
    foreach ($r in $list) {
        [void]$sb.AppendLine('<tr><td>' + $r.LopKiemThu + '</td><td>' + $r.NhomCon + '</td><td>' + $r.TenHienThi + '</td><td>' + $r.PhuongThuc + '</td><td>' + $r.SoLuot + '</td><td>' + $r.ThoiGian + '</td><td>' + $r.KetQua + '</td></tr>')
    }
    [void]$sb.AppendLine('</tbody></table>')
}
Hien-Bang 'Bộ kiểm thử đơn vị (phạm vi của báo cáo)' 'Cột thời gian là tổng thời gian thực thi của từng test case theo báo cáo Surefire. Nếu cộng thêm chi phí dựng kết nối giữa các test case thì tổng thời gian của 14 lớp là 10,238 giây.' $mainRows
Hien-Bang 'Hai lớp đối chứng dùng để so sánh có và không dùng kỹ thuật giả lập' 'Kết quả của 2 lớp này lấy từ lần chạy toàn bộ 163 lượt. Thời gian khởi động nền tảng của lớp không dùng kỹ thuật giả lập là 19.438 mili giây, được tính vào thời gian của lớp nên không nằm trong cột thời gian của từng test case.' $demoRows
[void]$sb.AppendLine('<script>function loc(){var k=document.getElementById("q").value.toLowerCase();var rs=document.querySelectorAll("table tbody tr");for(var i=0;i<rs.length;i++){rs[i].style.display=(rs[i].innerText.toLowerCase().indexOf(k)>-1)?"":"none";}}</script>')
[void]$sb.AppendLine('</body></html>')
$htmlPath = $root + '\Ket_qua_test_case.html'
[System.IO.File]::WriteAllText($htmlPath, $sb.ToString(), [System.Text.UTF8Encoding]::new($true))

Write-Output ('Bo kiem thu don vi: ' + $mainRows.Count + ' phuong thuc, ' + $mainLuot + ' luot, khong dat=' + $mainFail + ', thoi gian=' + ('{0:N3}' -f $mainTime) + ' giay')
Write-Output ('Lop doi chung: ' + $demoRows.Count + ' phuong thuc, ' + $demoLuot + ' luot, khong dat=' + $demoFail + ', thoi gian=' + ('{0:N3}' -f $demoTime) + ' giay')
Write-Output ('Da tao: ' + $csvPath)
Write-Output ('Da tao: ' + $htmlPath)
