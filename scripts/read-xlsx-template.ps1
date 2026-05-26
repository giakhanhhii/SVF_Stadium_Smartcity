$ErrorActionPreference = 'Stop'
$path = Join-Path $PSScriptRoot '..\Ke_hoach_6_tuan_SmartCity (1).xlsx'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open((Resolve-Path $path).Path)
foreach ($ws in $wb.Worksheets) {
  Write-Host "=== $($ws.Name) ==="
  $used = $ws.UsedRange
  $rows = [Math]::Min(50, $used.Rows.Count)
  $cols = [Math]::Min(8, $used.Columns.Count)
  for ($r = 1; $r -le $rows; $r++) {
    $line = @()
    for ($c = 1; $c -le $cols; $c++) {
      $v = $ws.Cells.Item($r, $c).Text
      if ($v) { $line += ("C$c=" + $v) }
    }
    if ($line.Count) { Write-Host ("Row $r | " + ($line -join ' | ')) }
  }
  Write-Host "Charts: $($ws.ChartObjects().Count)"
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
