$ErrorActionPreference = 'Stop'
$path = 'c:\Users\Administrator\Documents\Projects\Vinsmartcity\NguyenTrieuGiaKhanh_KeHoach_6Tuan_IOC_new.xlsx'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($path)
foreach ($ws in $wb.Worksheets) {
  Write-Host "=== $($ws.Name) charts=$($ws.ChartObjects().Count) ==="
  foreach ($co in $ws.ChartObjects()) {
    $ch = $co.Chart
    Write-Host "  Chart: $($ch.ChartTitle.Text) type=$($ch.ChartType) series=$($ch.SeriesCollection().Count)"
    if ($ch.SeriesCollection().Count -ge 1) {
      $s1 = $ch.SeriesCollection(1)
      Write-Host "    S1 name=$($s1.Name) values=$($s1.Values)"
    }
  }
  Write-Host "  H1=$($ws.Range('H1').Text) H2=$($ws.Range('H2').Text) I2=$($ws.Range('I2').Text)"
}
$wb.Close($false)
$excel.Quit()
