# Export IOC progress report to Excel (ASCII script, UTF-8 JSON data)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dataPath = Join-Path $root 'progress-data.json'
$outPath = Join-Path $root 'Vinsmartcity_BaoCao_TienDo_IOC.xlsx'
if (Test-Path $outPath) {
  try { Remove-Item $outPath -Force -ErrorAction Stop }
  catch {
    $outPath = Join-Path $root ('Vinsmartcity_BaoCao_TienDo_IOC_' + (Get-Date -Format 'yyyyMMdd_HHmm') + '.xlsx')
  }
}

function RGB($r, $g, $b) { return $r + ($g * 256) + ($b * 65536) }

$data = Get-Content $dataPath -Raw -Encoding UTF8 | ConvertFrom-Json
$L = $data.labels
$SD = $data.statusDone
$SW = $data.statusWip
$ST = $data.statusTodo
$tasks = @($data.tasks | Sort-Object { [int]$_.weekPlan }, { [int]($_.cat -replace '^(\d+).*', '$1') }, { $_.task })
$weekPlan = @($data.weekPlan | Sort-Object { [int]$_.week })
$week1Done = @($data.week1Done)
$wp = $L.weekPrefix

$done = @($tasks | Where-Object { $_.status -eq $SD }).Count
$wip = @($tasks | Where-Object { $_.status -eq $SW }).Count
$todo = @($tasks | Where-Object { $_.status -eq $ST }).Count
$total = $tasks.Count
$pcts = $tasks | ForEach-Object { [double]$_.pct }
$avgPct = if ($pcts.Count) { [math]::Round(($pcts | Measure-Object -Average).Average, 1) } else { 0 }

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
if (Test-Path $outPath) {
  try { Remove-Item $outPath -Force -ErrorAction Stop } catch { }
}

$wb = $excel.Workbooks.Add()
$ws1 = $wb.Worksheets.Item(1)
$ws1.Name = 'Tong quan'

$ws1.Range('A1').Value2 = $L.title
$ws1.Range('A2').Value2 = $data.meta.project
$ws1.Range('A3').Value2 = "$($data.meta.weekReport) | $($data.meta.exportDate)"
$ws1.Range('A5').Value2 = $L.summary
$ws1.Range('A6').Value2 = $L.colMetric
$ws1.Range('B6').Value2 = $L.colCount
$ws1.Range('C6').Value2 = $L.colRate
function Set-Num($ws, $r, $c, $val) { $ws.Cells.Item($r, $c).Value2 = [double]$val }

$ws1.Cells.Item(7, 1).Value2 = $L.total
Set-Num $ws1 7 2 $total
$ws1.Cells.Item(8, 1).Value2 = $L.done; Set-Num $ws1 8 2 $done
$ws1.Cells.Item(8, 3).Value2 = "$([math]::Round($done/$total*100,1))%"
$ws1.Cells.Item(9, 1).Value2 = $L.wip; Set-Num $ws1 9 2 $wip
$ws1.Cells.Item(10, 1).Value2 = $L.todo; Set-Num $ws1 10 2 $todo
$ws1.Cells.Item(11, 1).Value2 = $L.avgPct; Set-Num $ws1 11 2 $avgPct
$ws1.Range('A13').Value2 = $L.byCategory
$ws1.Range('A14').Value2 = $L.category
$ws1.Range('B14').Value2 = $L.progress

$row = 15
foreach ($g in ($tasks | Group-Object cat | Sort-Object { [int]($_.Name -replace '^(\d+).*', '$1') })) {
  $vals = $g.Group | ForEach-Object { [double]$_.pct }
  $cp = [math]::Round(($vals | Measure-Object -Average).Average, 0)
  $ws1.Cells.Item($row, 1).Value2 = ($g.Name -replace '^\d+\.\s*', '')
  Set-Num $ws1 $row 2 $cp
  $row++
}
$lastDataRow = $row - 1

$co1 = $ws1.ChartObjects().Add(260, 15, 330, 210)
$co1.Chart.ChartType = 5
$co1.Chart.SetSourceData($ws1.Range('A8:B10'))
$co1.Chart.HasTitle = $true
$co1.Chart.ChartTitle.Text = $L.chartStatus
$co2 = $ws1.ChartObjects().Add(260, 240, 430, 270)
$co2.Chart.ChartType = 57
$co2.Chart.SetSourceData($ws1.Range("A14:B$lastDataRow"))
$co2.Chart.HasTitle = $true
$co2.Chart.ChartTitle.Text = $L.chartCategory

$ws1.Range('A1').Font.Size = 18
$ws1.Range('A1').Font.Bold = $true
$ws1.Range('A1').Font.Color = RGB 24 95 165
$ws1.Range('A6:C6').Interior.Color = RGB 24 95 165
$ws1.Range('A6:C6').Font.Color = RGB 255 255 255
$ws1.Range('A6:C6').Font.Bold = $true
$ws1.Range('A14:B14').Interior.Color = RGB 230 241 251
$ws1.Range('A14:B14').Font.Bold = $true
$ws1.Columns.Item('A').ColumnWidth = 36
$ws1.Columns.Item('B').ColumnWidth = 14

$ws2 = $wb.Worksheets.Add([Type]::Missing, $ws1)
$ws2.Name = 'Chi tiet cong viec'
$hdr = @('STT', $L.category, $L.colTask, $L.colStatus, $L.progress, $L.colWeekDone, $L.colWeekPlan, $L.colNote)
for ($c = 0; $c -lt 8; $c++) { $ws2.Cells.Item(1, $c+1).Value2 = $hdr[$c] }

$r = 2; $i = 1
foreach ($t in $tasks) {
  Set-Num $ws2 $r 1 $i
  $ws2.Cells.Item($r,2).Value2 = $t.cat
  $ws2.Cells.Item($r,3).Value2 = $t.task
  $ws2.Cells.Item($r,4).Value2 = $t.status
  Set-Num $ws2 $r 5 ([int]$t.pct)
  $ws2.Cells.Item($r,6).Value2 = if ([int]$t.weekDone -gt 0) { "$wp $($t.weekDone)" } else { '-' }
  $ws2.Cells.Item($r,7).Value2 = "$wp $($t.weekPlan)"
  $ws2.Cells.Item($r,8).Value2 = $t.note
  $sc = $ws2.Cells.Item($r,4)
  if ($t.status -eq $SD) { $sc.Interior.Color = RGB 225 245 234; $sc.Font.Color = RGB 15 110 86 }
  elseif ($t.status -eq $SW) { $sc.Interior.Color = RGB 250 238 218; $sc.Font.Color = RGB 133 79 11 }
  else { $sc.Interior.Color = RGB 240 240 240; $sc.Font.Color = RGB 80 80 80 }
  $r++; $i++
}
$ws2.Range('A1:H1').Interior.Color = RGB 4 44 83
$ws2.Range('A1:H1').Font.Color = RGB 255 255 255
$ws2.Range('A1:H1').Font.Bold = $true
$ws2.Range("A1:H$($r-1)").Borders.LineStyle = 1
$ws2.Rows.Item(2).Select() | Out-Null
$excel.ActiveWindow.FreezePanes = $true
$ws2.Range('A1:H1').AutoFilter() | Out-Null
@(5,28,48,14,10,10,10,32) | ForEach-Object -Begin { $ci=1 } -Process { $ws2.Columns.Item($ci).ColumnWidth = $_; $ci++ }

$ws3 = $wb.Worksheets.Add([Type]::Missing, $ws2)
$ws3.Name = 'Ke hoach tuan'
$ws3.Range('A1').Value2 = $L.roadmapTitle
$ws3.Range('A1').Font.Size = 14; $ws3.Range('A1').Font.Bold = $true; $ws3.Range('A1').Font.Color = RGB 24 95 165
$ws3.Range('A3').Value2 = $wp
$ws3.Range('B3').Value2 = $L.colTime
$ws3.Range('C3').Value2 = $L.colFocus
$ws3.Range('D3').Value2 = $L.colDeliverable
$ws3.Range('E3').Value2 = $L.colStatus
$r = 4
foreach ($w in $weekPlan) {
  $ws3.Cells.Item($r,1).Value2 = "$wp $($w.week)"
  $ws3.Cells.Item($r,2).Value2 = $w.dates
  $ws3.Cells.Item($r,3).Value2 = $w.focus
  $ws3.Cells.Item($r,4).Value2 = $w.deliverables
  $ws3.Cells.Item($r,5).Value2 = $w.status
  if ($w.status -eq $SD) { $ws3.Range("A$r`:E$r").Interior.Color = RGB 225 245 234 }
  elseif ($w.status -eq $SW) { $ws3.Range("A$r`:E$r").Interior.Color = RGB 230 241 251 }
  $r++
}
$ws3.Range('A3:E3').Interior.Color = RGB 4 44 83
$ws3.Range('A3:E3').Font.Color = RGB 255 255 255
$ws3.Range('A3:E3').Font.Bold = $true
$ws3.Range("A3:E$($r-1)").Borders.LineStyle = 1
@(10,18,42,42,14) | ForEach-Object -Begin {$ci=1} -Process {$ws3.Columns.Item($ci).ColumnWidth=$_; $ci++}
$ws3.Rows.Item('3:12').WrapText = $true

# --- Sheet: Cong viec theo tuan (Week 1 at top, then 2, 3...) ---
$ws3b = $wb.Worksheets.Add([Type]::Missing, $ws3)
$ws3b.Name = 'Cong viec theo tuan'
$ws3b.Range('A1').Value2 = $L.byWeekTitle
$ws3b.Range('A1').Font.Size = 14
$ws3b.Range('A1').Font.Bold = $true
$ws3b.Range('A1').Font.Color = RGB 24 95 165
$ws3b.Range('A3').Value2 = $L.colTask
$ws3b.Range('B3').Value2 = $L.colStatus
$ws3b.Range('C3').Value2 = $L.progress
$ws3b.Range('D3').Value2 = $L.colNote
$ws3b.Range('A3:D3').Interior.Color = RGB 4 44 83
$ws3b.Range('A3:D3').Font.Color = RGB 255 255 255
$ws3b.Range('A3:D3').Font.Bold = $true
$r = 4
foreach ($w in $weekPlan) {
  $wn = [int]$w.week
  $ws3b.Cells.Item($r, 1).Value2 = "$wp $wn ($($w.dates))"
  $ws3b.Range("A$r`:D$r").Interior.Color = RGB 24 95 165
  $ws3b.Range("A$r`:D$r").Font.Color = RGB 255 255 255
  $ws3b.Range("A$r`:D$r").Font.Bold = $true
  $ws3b.Range("A$r`:D$r").Merge() | Out-Null
  $r++
  $ws3b.Cells.Item($r, 1).Value2 = $w.focus
  $ws3b.Range("A$r`:D$r").Font.Italic = $true
  $ws3b.Range("A$r`:D$r").Merge() | Out-Null
  $ws3b.Range("A$r`:D$r").Interior.Color = RGB 230 241 251
  $r++
  $weekTasks = @($data.tasks | Where-Object { [int]$_.weekPlan -eq $wn } | Sort-Object { [int]($_.cat -replace '^(\d+).*', '$1') }, { $_.task })
  if ($weekTasks.Count -eq 0) {
    $ws3b.Cells.Item($r, 1).Value2 = '(Khong co cong viec)'
    $ws3b.Range("A$r`:D$r").Merge() | Out-Null
    $r++
  } else {
    foreach ($t in $weekTasks) {
      $ws3b.Cells.Item($r, 1).Value2 = "$($t.cat): $($t.task)"
      $ws3b.Cells.Item($r, 2).Value2 = $t.status
      Set-Num $ws3b $r 3 ([int]$t.pct)
      $ws3b.Cells.Item($r, 4).Value2 = $t.note
      $sc = $ws3b.Cells.Item($r, 2)
      if ($t.status -eq $SD) { $sc.Interior.Color = RGB 225 245 234; $sc.Font.Color = RGB 15 110 86 }
      elseif ($t.status -eq $SW) { $sc.Interior.Color = RGB 250 238 218; $sc.Font.Color = RGB 133 79 11 }
      else { $sc.Interior.Color = RGB 240 240 240; $sc.Font.Color = RGB 80 80 80 }
      $r++
    }
  }
  $r++
}
$ws3b.Columns.Item('A').ColumnWidth = 55
$ws3b.Columns.Item('B').ColumnWidth = 14
$ws3b.Columns.Item('C').ColumnWidth = 10
$ws3b.Columns.Item('D').ColumnWidth = 32
$ws3b.Range("A3:D$($r-1)").Borders.LineStyle = 1

$ws4 = $wb.Worksheets.Add([Type]::Missing, $ws3b)
$ws4.Name = 'Tuan 1 - Da xong'
$ws4.Range('A1').Value2 = $L.week1Title
$ws4.Range('A1').Font.Bold = $true; $ws4.Range('A1').Font.Size = 13; $ws4.Range('A1').Font.Color = RGB 15 110 86
$ws4.Range('A3').Value2 = 'STT'
$ws4.Range('B3').Value2 = $L.colWork
$ws4.Range('C3').Value2 = $L.colModule
$r=4; $i=1
foreach ($item in $week1Done) {
  Set-Num $ws4 $r 1 $i
  $ws4.Cells.Item($r,2).Value2 = $item[0]
  $ws4.Cells.Item($r,3).Value2 = $item[1]
  $r++; $i++
}
$ws4.Range('A3:C3').Interior.Color = RGB 15 110 86
$ws4.Range('A3:C3').Font.Color = RGB 255 255 255
$ws4.Range('A3:C3').Font.Bold = $true
$ws4.Columns.Item('B').ColumnWidth = 52
$ws4.Columns.Item('C').ColumnWidth = 36

$ws5 = $wb.Worksheets.Add([Type]::Missing, $ws4)
$ws5.Name = 'Chua xong'
$ws5.Range('A1').Value2 = $L.pendingTitle
$ws5.Range('A1').Font.Bold = $true; $ws5.Range('A1').Font.Color = RGB 163 45 45
$ws5.Range('A3').Value2 = 'STT'
$ws5.Range('B3').Value2 = $L.colWork
$ws5.Range('C3').Value2 = $L.colStatus
$ws5.Range('D3').Value2 = $L.colWeekPlan
$ws5.Range('E3').Value2 = $L.colNote
$pending = $tasks | Where-Object { $_.status -ne $SD -or [int]$_.pct -lt 100 } | Sort-Object { [int]$_.weekPlan }, { [int]($_.cat -replace '^(\d+).*', '$1') }, { $_.task }
$r=4; $i=1
foreach ($t in $pending) {
  Set-Num $ws5 $r 1 $i
  $ws5.Cells.Item($r,2).Value2 = "$($t.cat): $($t.task)"
  $ws5.Cells.Item($r,3).Value2 = $t.status
  $ws5.Cells.Item($r,4).Value2 = "$wp $($t.weekPlan)"
  $ws5.Cells.Item($r,5).Value2 = $t.note
  $r++; $i++
}
$ws5.Range('A3:E3').Interior.Color = RGB 163 45 45
$ws5.Range('A3:E3').Font.Color = RGB 255 255 255
$ws5.Range('A3:E3').Font.Bold = $true
$ws5.Columns.Item('B').ColumnWidth = 55
$ws5.Columns.Item('E').ColumnWidth = 30

while ($wb.Worksheets.Count -gt 6) { $wb.Worksheets.Item($wb.Worksheets.Count).Delete() }

# Tab order: Tong quan | Ke hoach tuan | Cong viec theo tuan | Chi tiet | Tuan 1 | Chua xong
$order = @('Tong quan', 'Ke hoach tuan', 'Cong viec theo tuan', 'Chi tiet cong viec', 'Tuan 1 - Da xong', 'Chua xong')
for ($i = $order.Count - 1; $i -ge 0; $i--) {
  $wb.Worksheets.Item($order[$i]).Move($wb.Worksheets.Item(1))
}

$wb.SaveAs($outPath, 51)
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "Exported: $outPath"
