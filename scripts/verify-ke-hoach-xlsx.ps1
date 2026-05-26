$ErrorActionPreference = 'Stop'
$path = 'c:\Users\Administrator\Documents\Projects\Vinsmartcity\NguyenTrieuGiaKhanh_KeHoach_6Tuan_IOC.xlsx'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($path)
Write-Host "Sheets:"
foreach ($ws in $wb.Worksheets) {
  Write-Host " - $($ws.Name) | charts=$($ws.ChartObjects().Count) | rows=$($ws.UsedRange.Rows.Count)"
  for ($r = 1; $r -le [Math]::Min(12, $ws.UsedRange.Rows.Count); $r++) {
    $v = $ws.Cells.Item($r, 1).Text
    if ($v) { Write-Host ("   Row " + $r + ": " + $v) }
  }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
